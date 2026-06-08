# Sistema Universal de Contas - Guia de Implementação

## Visão Geral

O YAMI possui um sistema centralizado de gerenciamento de contas que permite conexão uma única vez com múltiplos serviços. Após a conexão inicial, o YAMI reutiliza essas credenciais automaticamente para executar tarefas compatíveis.

## Arquitetura

```
~/.yami/auth/
├── providers/
│   └── registry.json         # Catálogo de 15+ provedores
├── accounts.json             # Metadados de contas conectadas
├── tokens/                   # Armazenamento de OAuth tokens
│   ├── google/
│   ├── microsoft/
│   ├── github/
│   └── ...
└── IMPLEMENTACAO.md          # Este arquivo
```

## Fluxo de Conexão

### 1. Usuário Clica em "Conectar"

```
Frontend → POST /api/accounts/connect
├── provider: "google"
├── email: "user@gmail.com"
└── displayName: "Google Pessoal"
```

### 2. Backend Valida e Armazena

```javascript
// auto-panel/server.js - conectAccount()
{
  provider: "google",
  status: "connected",
  email: "user@gmail.com",
  displayName: "Google Pessoal",
  scopes: [...],
  permissions: [
    { id: "email", name: "Ler e-mails", granted: true },
    { id: "calendar", name: "Consultar agenda", granted: true },
    { id: "drive", name: "Buscar arquivos", granted: true }
  ],
  connectedAt: "2026-06-08T...",
  lastSyncAt: "2026-06-08T...",
  error: null
}
```

### 3. Reutilização Automática

Quando um comando é executado (ex: "Quais são meus compromissos?"), o YAMI:

1. Detecta que precisa de acesso ao Google Calendar
2. Consulta `accounts.json` e encontra Google conectado
3. Carrega o token de `auth/tokens/google/...`
4. Executa a tarefa sem exigir reconfiguração

## Adicionando um Novo Provedor

### Passo 1: Registrar em `registry.json`

```json
{
  "id": "slack",
  "name": "Slack",
  "icon": "S",
  "iconClass": "p",
  "category": "messaging",
  "description": "Canais, mensagens e notificações",
  "color": "#4a154b",
  "authType": "oauth2",
  "authUrl": "https://slack.com/oauth/authorize",
  "tokenUrl": "https://slack.com/oauth/token",
  "scopes": [
    "chat:write",
    "channels:read",
    "users:read"
  ],
  "capabilities": [
    { "id": "chat", "name": "Enviar mensagens em canais" },
    { "id": "notify", "name": "Notificações" }
  ],
  "enabled": true
}
```

### Passo 2: Criar Handler de OAuth (Novo arquivo)

`auto-panel/auth-handlers/oauth-slack.js`:

```javascript
const https = require("https");

function buildAuthUrl(clientId, redirectUri, scopes) {
  const state = require("crypto").randomBytes(16).toString("hex");
  return {
    url: `https://slack.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scopes=${scopes.join(",")}&state=${state}`,
    state
  };
}

async function exchangeCode(code, clientId, clientSecret, redirectUri) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    });

    const options = {
      hostname: "slack.com",
      path: "/api/oauth.v2.access",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.ok) {
            resolve({
              accessToken: json.authed_user.access_token,
              refreshToken: json.authed_user.refresh_token || null,
              expiresAt: json.authed_user.expires_in ? new Date(Date.now() + json.authed_user.expires_in * 1000).toISOString() : null,
              userId: json.authed_user.id,
              teamId: json.team.id
            });
          } else {
            reject(new Error(json.error || "OAuth falhou"));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

module.exports = {
  buildAuthUrl,
  exchangeCode,
  providerType: "oauth2",
  scopes: ["chat:write", "channels:read", "users:read"]
};
```

### Passo 3: Registrar Handler no Server

`auto-panel/server.js`:

```javascript
const authHandlers = {
  google: require('./auth-handlers/oauth-google'),
  slack: require('./auth-handlers/oauth-slack'),
  github: require('./auth-handlers/oauth-github'),
  // ...
};
```

## API Endpoints Detalhados

### GET /api/accounts

**Retorna:**
```json
{
  "ok": true,
  "accounts": [
    {
      "provider": "google",
      "name": "Google",
      "icon": "G",
      "connected": true,
      "status": "connected",
      "displayName": "Gmail Pessoal",
      "email": "user@gmail.com",
      "permissions": [
        { "id": "email", "name": "Ler e-mails", "granted": true, "grantedAt": "2026-06-08T..." },
        { "id": "calendar", "name": "Consultar agenda", "granted": true, "grantedAt": "2026-06-08T..." }
      ],
      "scopes": ["https://www.googleapis.com/auth/gmail.readonly", "..."],
      "connectedAt": "2026-06-08T...",
      "lastSyncAt": "2026-06-08T...",
      "error": null
    }
  ],
  "categories": [...],
  "updatedAt": "2026-06-08T..."
}
```

### POST /api/accounts/connect

**Body:**
```json
{
  "provider": "google",
  "email": "user@gmail.com",
  "displayName": "Gmail Pessoal"
}
```

**Retorna:** Conta conectada com status "connected"

### POST /api/accounts/disconnect

**Body:**
```json
{
  "provider": "google"
}
```

### POST /api/accounts/sync

**Body:**
```json
{
  "provider": "google"
}
```

Força sincronização de tokens (refresh se expirado)

### POST /api/accounts/revoke

**Body:**
```json
{
  "provider": "google"
}
```

Revoga permissões sem deletar a conta (pode reconectar depois)

## Usando Contas em Tarefas

### Exemplo 1: Ler E-mails (Google)

```javascript
// No skill ou command handler
async function readEmails(taskContext) {
  const { accountsManager } = taskContext;
  
  // Obter conta Google conectada
  const googleAccount = await accountsManager.getAccount("google");
  if (!googleAccount?.connected) {
    return { error: "Google nao conectado. Conecte em Integracoes." };
  }

  // Carregar token
  const token = await accountsManager.getToken("google");
  
  // Usar token com Gmail API
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const messages = await gmail.users.messages.list({ userId: 'me' });
  
  return { emails: messages.data.messages };
}
```

### Exemplo 2: Sincronizar Agenda (Microsoft)

```javascript
async function syncCalendar(taskContext) {
  const { accountsManager } = taskContext;
  
  const msAccount = await accountsManager.getAccount("microsoft");
  if (!msAccount?.connected) throw new Error("Microsoft nao conectado");

  // Verificar se token expirou
  if (new Date(msAccount.expiresAt) < new Date()) {
    await accountsManager.refreshToken("microsoft");
  }

  const token = await accountsManager.getToken("microsoft");
  // ... usar token com MS Graph API
}
```

## Segurança

### Armazenamento de Tokens

- Tokens OAuth armazenados em `auth/tokens/{provider}/token.json`
- Cada arquivo é específico do provedor
- Em produção, usar criptografia em repouso

### Permissões Granulares

- Cada provedor define seus `scopes` necessários
- Permissões são explícitas e auditáveis
- Usuário pode revogar sem deletar a conta

### Auditoria

- `connectedAt`: Quando a conta foi conectada
- `lastSyncAt`: Última sincronização bem-sucedida
- `permissions[].grantedAt`: Quando cada permissão foi concedida
- `error`: Última falha (se houver)

## Sincronização Automática

O YAMI sincroniza automaticamente contas a cada 15 minutos (configurável):

```json
// yami.json
{
  "auth": {
    "accounts": {
      "autoSync": true,
      "syncIntervalMinutes": 15
    }
  }
}
```

Lógica:
```javascript
setInterval(async () => {
  const { accounts } = readAccounts();
  for (const account of accounts.filter(a => a.connected)) {
    await syncAccount(account.provider);
  }
}, 15 * 60 * 1000);
```

## Expansão Futura

### Provedores Planejados

- [ ] Dropbox (storage)
- [ ] Box (storage)
- [ ] Asana (produtividade)
- [ ] Monday.com (produtividade)
- [ ] Linear (DevOps)
- [ ] Jira (DevOps)
- [ ] AWS (cloud)
- [ ] Azure (cloud)
- [ ] Facebook (social)
- [ ] Twitter (social)
- [ ] LinkedIn (social)
- [ ] Instagram (social)

### Recursos Futuros

- [ ] Multi-conta por provedor (ex: 2 contas Google)
- [ ] Compartilhamento seguro entre dispositivos
- [ ] Histórico de acessos (auditoria)
- [ ] Limite de rate-limits por provedor
- [ ] Fallback automático em caso de erro
- [ ] Notificações de expiração de token

## Troubleshooting

### "Conta nao encontrada"

```
POST /api/accounts/sync com provider não registrado
→ Verifique registry.json se o provedor existe
```

### "Permissoes revogadas"

```
Usuário revogou acesso no painel do provedor
→ Reconecte em Integracoes
```

### Token Expirado

```
"status": "revoked" no accounts.json
→ O YAMI tentará refresh automático
→ Se falhar, avisa usuário em "Integracoes"
```

## Referências

- `~/.yami/auth/providers/registry.json` — Catálogo de provedores
- `~/.yami/auth/accounts.json` — Estado das contas
- `auto-panel/server.js` — API endpoints (linhas ~1620+)
- `auto-panel/public/index.html` — Painel visual (menu-integrations-page)
