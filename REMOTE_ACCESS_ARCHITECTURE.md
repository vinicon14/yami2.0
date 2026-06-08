# Sistema de Acesso Remoto Multiplataforma YAMI

**Documento de Arquitetura**

## 1. Visão Geral

O sistema de acesso remoto multiplataforma permite que usuários interajam com o YAMI através de múltiplos dispositivos sincronizados em tempo real. A arquitetura garante continuidade de experiência, independentemente do dispositivo utilizado.

### Princípios Fundamentais

1. **Sincronização em Tempo Real** - Todas as mudanças são propagadas instantaneamente via WebSocket
2. **Continuidade de Sessão** - Conversas e contexto persistem entre dispositivos
3. **Baixa Complexidade** - Interface consistente em todos os clientes
4. **Offline-First** - Sistema funciona offline com sincronização automática quando online
5. **Escalabilidade** - Arquitetura preparada para múltiplos usuários e dispositivos

## 2. Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                     YAMI PRIMARY (Main Computer)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐          ┌──────────────────────┐     │
│  │  Remote Gateway      │          │  Status Monitor      │     │
│  │  (WebSocket Server)  │          │  (Activity Tracker)  │     │
│  └──────────────────────┘          └──────────────────────┘     │
│           △                                    △                  │
│           │                                    │                  │
│  ┌──────────────────────┐          ┌──────────────────────┐     │
│  │  Device Manager      │          │  Conversation Cache  │     │
│  │  (Pairing/Auth)      │          │  (Session State)     │     │
│  └──────────────────────┘          └──────────────────────┘     │
│           │                                    │                  │
│  ┌──────────────────────┐          ┌──────────────────────┐     │
│  │  Sync Engine         │          │  Notification Hub    │     │
│  │  (Real-time Sync)    │          │  (Push Dispatcher)   │     │
│  └──────────────────────┘          └──────────────────────┘     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Event Bus (Activity & Status Broadcasting)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                    ▲ WebSocket / HTTPS ▲
         ┌──────────┼──────────┬─────────┼──────────┐
         │          │          │         │          │
    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌─▼────┐ ┌───▼────┐
    │ Desktop│ │Notebook│ │Tablet  │ │Phone │ │Web UI  │
    │ Client │ │ Client │ │ Client │ │Client│ │Browser │
    └────────┘ └────────┘ └────────┘ └──────┘ └────────┘
```

## 3. Módulos Principais

### 3.1 Remote Gateway Server (`remote-gateway/`)

**Localização**: `C:\Users\vinim\.yami\remote-gateway\`

Servidor central que gerencia todas as conexões remotas.

```javascript
// remote-gateway/server.js
- Porta: 18790 (primária), 18791 (backup)
- WebSocket: ws://localhost:18790/socket
- HTTPS: https://localhost:18790/api
- Autenticação: Token-based + Device public key validation
- Compressão: mensagens comprimidas com brotli
- Pool de conexões: máximo 100 conexões simultâneas
```

**Responsabilidades**:
- Aceitar conexões de clientes remotos
- Autenticar dispositivos via pairing tokens
- Manter estado de conexão por dispositivo
- Broadcast de eventos em tempo real
- Gerenciamento de reconexão automática
- Rate limiting por dispositivo

### 3.2 Device Manager (`remote-gateway/device-manager.js`)

Gerencia pairing, autenticação e autorização de dispositivos.

**Dados Persistidos** (`devices/pairing-remote.json`):
```json
{
  "device_id": {
    "deviceId": "string",
    "displayName": "iPhone 13",
    "platform": "ios|android|windows|macos|web",
    "clientId": "mobile-app|web-ui|desktop-app",
    "publicKey": "base64-encoded-key",
    "role": "operator|viewer|guest",
    "scopes": [
      "remote.status.read",
      "remote.tasks.read",
      "remote.chat.write",
      "remote.voice.write",
      "remote.activities.read",
      "remote.automation.monitor"
    ],
    "tokens": {
      "session": {
        "token": "string",
        "expiresAt": "2026-06-15T10:00:00Z",
        "createdAt": "2026-06-08T10:00:00Z"
      }
    },
    "lastSeen": "2026-06-08T14:30:00Z",
    "isActive": true,
    "connectionStatus": "online|offline|idle"
  }
}
```

### 3.3 Sync Engine (`remote-gateway/sync-engine.js`)

Implementa sincronização bidirecional em tempo real.

**Fluxo de Sincronização**:
```
Local Change
    ↓
Event Emitted
    ↓
Sync Engine captures event
    ↓
Serialize to Protocol Buffer / JSON
    ↓
Broadcast to connected clients
    ↓
Client receives change
    ↓
Local DB updated
    ↓
Confirmation sent back
```

**Protocolo de Sincronização**:
```protobuf
message SyncMessage {
  string id = 1;
  string type = 2;  // "task.created", "activity.updated", etc
  int64 timestamp = 3;
  string source_device = 4;
  bytes payload = 5;
  string sequence_id = 6;  // Para garantir ordem
}
```

### 3.4 Session Manager (`remote-gateway/session-manager.js`)

Gerencia continuidade de sessão entre dispositivos.

**Dados de Sessão** (`remote-gateway/sessions/`):
```json
{
  "session_id": {
    "sessionId": "string",
    "userId": "string",
    "createdAt": "2026-06-08T10:00:00Z",
    "lastActivityAt": "2026-06-08T14:30:00Z",
    "devices": ["device_id_1", "device_id_2"],
    "primaryDevice": "device_id_1",
    "conversationContext": {
      "lastMessageId": "string",
      "threadId": "string",
      "summary": "string",
      "variables": {}
    },
    "state": {
      "activeTask": "string",
      "selectedFilter": "string",
      "viewMode": "grid|list"
    }
  }
}
```

### 3.5 Status Monitor (`remote-gateway/status-monitor.js`)

Monitora e broadcast do status do computador principal.

**Status Monitored**:
```json
{
  "computer": {
    "hostname": "PCVINI",
    "platform": "win32",
    "uptime": 86400,
    "isOnline": true,
    "lastOnlineAt": "2026-06-08T14:30:00Z"
  },
  "yami": {
    "isRunning": true,
    "version": "2026.6.2",
    "uptime": 3600,
    "cpuUsage": 15.2,
    "memoryUsage": 1024,
    "isRecording": false,
    "isBusy": false
  },
  "tasks": {
    "total": 5,
    "running": 2,
    "completed": 3,
    "failed": 0,
    "pending": 0
  },
  "notifications": {
    "unreadCount": 3,
    "lastNotification": "2026-06-08T14:25:00Z"
  }
}
```

### 3.6 Conversation Cache (`remote-gateway/conversation-cache.js`)

Persiste conversas para continuidade entre dispositivos.

**Armazenamento** (`database/conversations/`):
```json
{
  "conversation_id": {
    "id": "string",
    "createdAt": "2026-06-08T10:00:00Z",
    "updatedAt": "2026-06-08T14:30:00Z",
    "messages": [
      {
        "id": "msg_1",
        "role": "user|assistant",
        "content": "string",
        "timestamp": "2026-06-08T10:05:00Z",
        "device": "device_id",
        "attachments": []
      }
    ],
    "metadata": {
      "title": "string",
      "tags": [],
      "resolved": false
    }
  }
}
```

### 3.7 Notification Hub (`remote-gateway/notification-hub.js`)

Gerencia notificações push para todos os clientes.

**Tipos de Notificações**:
- Task status changes
- Automation progress updates
- Important alerts
- Conversation updates
- System status changes

## 4. Fluxos de Dados Principais

### 4.1 Fluxo de Inicialização de Dispositivo

```
1. Device inicia aplicação cliente
2. Cliente recupera stored pairing token
3. Envia: {device_id, token, public_key}
4. Gateway valida token + key
5. If válido:
   - Cria sessão
   - Retorna: {session_id, server_public_key}
6. Cliente estabelece WebSocket com autenticação
7. Cliente request sync de estado completo
8. Gateway envia estado inicial
9. Cliente armazena localmente
10. WebSocket entra em modo de listener para mudanças
```

### 4.2 Fluxo de Sincronização em Tempo Real

```
MAIN PC EVENT:
1. Tarefa completa no YAMI
2. Event "task.completed" emitido
3. Sync Engine captura evento
4. Cria SyncMessage com payload
5. Broadcast para todos clientes conectados
6. Cada cliente recebe
7. Valida autorização (scopes)
8. Atualiza DB local
9. Emite evento no cliente
10. UI re-renderiza
11. Cliente enviia ACK de confirmação
```

### 4.3 Fluxo de Interação Remota (Chat)

```
REMOTE DEVICE:
1. Usuário envia mensagem via dispositivo remoto
2. Mensagem enfileirada localmente
3. Cliente tenta enviar para gateway
4. If online:
   - Envia via WebSocket
5. If offline:
   - Armazena em fila offline
6. Gateway recebe mensagem
7. Valida autorização
8. Forwarda para YAMI runtime
9. YAMI processa e responde
10. Resposta volta ao gateway
11. Gateway broadcast para todos clientes (inclusive sender)
12. UI atualiza
13. Se offline, sincroniza quando online
```

## 5. Estrutura de Diretórios

```
.yami/
├── remote-gateway/
│   ├── server.js                 # Entry point do servidor
│   ├── device-manager.js         # Gerenciamento de dispositivos
│   ├── sync-engine.js            # Engine de sincronização
│   ├── session-manager.js        # Gerenciamento de sessões
│   ├── status-monitor.js         # Monitor de status
│   ├── conversation-cache.js     # Cache de conversas
│   ├── notification-hub.js       # Hub de notificações
│   ├── middleware/
│   │   ├── auth.js              # Autenticação
│   │   ├── validation.js        # Validação de mensagens
│   │   └── rate-limiter.js      # Rate limiting
│   ├── utils/
│   │   ├── crypto.js            # Utilitários de criptografia
│   │   ├── message-protocol.js  # Serialização de mensagens
│   │   └── logger.js            # Logging estruturado
│   └── package.json
│
├── clients/
│   ├── web-ui/                   # Cliente web React
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── app.jsx
│   │   └── package.json
│   │
│   ├── mobile-framework/         # Framework para mobile
│   │   ├── shared/
│   │   │   ├── api-client.js
│   │   │   ├── sync-manager.js
│   │   │   └── storage.js
│   │   ├── ios/                  # Placeholder para iOS
│   │   └── android/              # Placeholder para Android
│   │
│   └── desktop-app/              # App desktop Electron
│       ├── main.js
│       ├── preload.js
│       └── package.json
│
├── database/
│   ├── conversations/            # Armazenamento de conversas
│   ├── activities/               # Log de atividades
│   └── automation-progress/      # Progress de automações
│
├── devices/
│   ├── paired.json               # Devices já pareados (existente)
│   ├── pairing-remote.json       # Devices remotos pareados (novo)
│   └── pending.json              # Pending pairing requests (existente)
│
└── remote-gateway.log            # Log do servidor remoto
```

## 6. Protocolo de Comunicação

### 6.1 WebSocket Messages

**Message Structure**:
```json
{
  "id": "unique-message-id",
  "type": "message-type",
  "timestamp": 1717862400000,
  "payload": {},
  "metadata": {
    "source": "device-id",
    "priority": "normal|high",
    "requiresAck": true
  }
}
```

**Message Types**:

```
CLIENT → SERVER:
- "auth.init": Iniciar autenticação
- "sync.request": Solicitar sincronização completa
- "chat.send": Enviar mensagem de chat
- "voice.send": Enviar áudio para STT
- "status.ping": Keep-alive
- "task.acknowledge": Reconhecer recebimento
- "automation.subscribe": Inscrever em updates de automação

SERVER → CLIENT:
- "auth.success": Autenticação bem-sucedida
- "sync.update": Atualização de sincronização
- "sync.full": Estado completo (resposta a sync.request)
- "chat.message": Nova mensagem de chat
- "task.updated": Tarefa atualizada
- "activity.log": Log de atividade
- "notification.push": Notificação push
- "status.update": Status do computador principal
- "automation.progress": Progresso de automação
- "error.auth": Erro de autenticação
- "error.validation": Erro de validação
```

## 7. Segurança

### 7.1 Autenticação

1. **Device Pairing**: 
   - One-time pairing code + public key exchange
   - Armazenado em `devices/pairing-remote.json`

2. **Session Tokens**:
   - JWT com expiração (24h por padrão)
   - Refresh token para renovação
   - Vinculado a device_id

3. **Message Signing**:
   - Cada mensagem assinada com private key do device
   - Gateway valida com public key

### 7.2 Criptografia

1. **Transport**:
   - HTTPS/WSS obrigatório
   - TLS 1.3+

2. **End-to-End** (opcional):
   - Mensagens sensíveis (chat, voice) criptografadas com chave compartilhada
   - Algoritmo: AES-256-GCM

## 8. Plano de Implementação

### Fase 1: Core Infrastructure (2 sprints)
- [ ] Remote Gateway Server básico
- [ ] Device Manager com pairing
- [ ] WebSocket communication
- [ ] Basic authentication

### Fase 2: Real-Time Sync (2 sprints)
- [ ] Sync Engine
- [ ] Event broadcasting
- [ ] Session Manager
- [ ] Status Monitor

### Fase 3: Features (2 sprints)
- [ ] Conversation cache
- [ ] Notification hub
- [ ] Activity logging
- [ ] Automation monitoring

### Fase 4: Clients (3 sprints)
- [ ] Web UI client
- [ ] Mobile framework
- [ ] Desktop app
- [ ] Cross-platform testing

### Fase 5: Polish & Deployment (1 sprint)
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Documentation
- [ ] Production deployment

## 9. Métricas de Sucesso

- Message latency < 100ms (p95)
- Sync accuracy = 100%
- Uptime > 99.5%
- Support para 50+ simultaneous devices
- Battery impact < 5% (mobile)
- Data usage < 10MB/dia (idle)

## 10. Próximos Passos

1. Criar módulos base do Remote Gateway
2. Implementar WebSocket server
3. Desenvolver Device Manager
4. Criar cliente web React inicial
5. Testar sincronização básica
