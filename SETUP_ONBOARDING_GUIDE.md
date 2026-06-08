# YAMI - Guia de Configuração Inicial (Onboarding)

## 📌 Visão Geral

O fluxo de configuração inicial do YAMI foi desenvolvido para oferecer uma experiência simples, intuitiva e com linguagem acessível ao usuário. O sistema detecta automaticamente quando é a primeira execução e apresenta uma tela de permissões clara e organizada.

---

## 🎯 Características Principais

### ✅ Tela de Onboarding Automática
- **Detecta primeira execução**: O endpoint `/api/setup/status` verifica se `setup.completed` está marcado
- **Design cyber escuro**: Consistente com o tema visual do YAMI
- **Categorização de permissões**: Agrupa em 3 níveis:
  - 🔴 **Essencial** (3 itens): Câmera/Microfone, Arquivos, Notificações
  - ⭐ **Muito Recomendado** (3 itens): Navegador, Mouse/Teclado, Auto-inicialização
  - 💡 **Opcional** (5 itens): Integrações, Agenda, Mobile, Cloud, Pendrive

### ✅ Autorização Única
- Um único botão "Autorizar tudo e continuar"
- Animação sequencial mostrando checkmarks ✓ em cada permissão
- Progresso visual durante a configuração em tempo real

### ✅ Solicitar Permissões Reais do Navegador
- **Microfone** (Web Audio API): `navigator.mediaDevices.getUserMedia({ audio: true })`
- **Notificações** (Notification API): `Notification.requestPermission()`
- **Câmera** (Web Video API): `navigator.mediaDevices.getUserMedia({ video: true })`
- Status visual mostra quais permissões foram autorizadas/negadas

### ✅ Tela de Progresso
Mostra 5 etapas com barra visual:
1. Solicitando permissões do navegador
2. Criando estrutura de pastas
3. Configurando integrações
4. Salvando configurações
5. Finalizando

### ✅ Tela de Sucesso
Exibe:
- Confirmação visual (🎉✨)
- Status das 3 permissões críticas
- Botão "Começar a usar o Yami"
- Texto: "Seu Tamagotchi digital está pronto para acordar!"

### ✅ Dialog de Permissões Pós-Setup
Usuários podem revisar/editar permissões a qualquer momento via:
- **Settings → Segurança → Permissões**
- Modal dinâmico mostra status atual de cada permissão

---

## 🔧 Endpoints API

### `GET /api/setup/status`
Retorna o status da configuração inicial e lista de permissões categorizadas.

**Response:**
```json
{
  "ok": true,
  "completed": false,
  "setup": {
    "critical": [...],
    "recommended": [...],
    "optional": [...]
  }
}
```

### `POST /api/setup/complete`
Marca a configuração como concluída e salva permissões.

**Request Body:**
```json
{
  "permissions": {
    "microphone": true,
    "notifications": true,
    "camera": false
  }
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Configuração inicial concluída.",
  "setup": {
    "completed": true,
    "completedAt": "2026-06-08T...",
    "version": "yami-native-runtime-...",
    "permissions": {...}
  }
}
```

### `GET /api/setup/permissions`
Retorna permissões atuais e disponíveis para gerenciamento.

### `POST /api/setup/permissions`
Atualiza as permissões após o setup inicial.

---

## 📁 Estrutura de Diretórios Criada

Ao completar o setup, os seguintes diretórios são criados automaticamente:

```
~/.yami/
├── comunicacao/          # Mensagens e comunicação
├── agenda/               # Calendários e compromissos
├── arquivos/             # Documentos do usuário
├── fotos/                # Galeria de imagens
├── media/                # Mídia geral
│   └── outgoing/         # Mídia para compartilhar
├── auto-panel/
│   └── tts/              # Áudio sintetizado
└── agents/
    └── main/
        └── sessions/     # Sessões de conversa
```

---

## 🎨 Estilos CSS Principais

- `.onboarding` - Overlay fullscreen com z-index: 9999
- `.onboarding-card` - Card centralizado com borda glassomorphism
- `.onboarding-perm` - Item de permissão com animação fade-up
- `.onboarding-perm.checked` - Estado de permissão autorizada
- `.onboarding-btn` - Botão principal com gradiente cyan/amber

**Animações:**
- `ob-spin`: Spinner de carregamento
- `ob-fade-up`: Entrada sequencial das permissões
- `ob-pulse`: Pulsação do logo no sucesso

---

## 🔄 Fluxo de Execução Completo

```
1. Usuário abre YAMI pela primeira vez
   ↓
2. JavaScript: checkOnboarding()
   ↓
3. GET /api/setup/status → completed=false
   ↓
4. showOnboarding() renderiza tela com 11 permissões categorizadas
   ↓
5. Usuário clica "Autorizar tudo e continuar"
   ↓
6. Animação de checkmarks nas permissões (60ms cada)
   ↓
7. Mostrar tela de progresso com 5 etapas
   ↓
8. requestBrowserPermissions():
   - Solicita microfone → getUserMedia({ audio: true })
   - Solicita notificações → Notification.requestPermission()
   - Solicita câmera → getUserMedia({ video: true })
   ↓
9. POST /api/setup/complete com resultados
   ↓
10. Backend:
    - Cria estrutura de diretórios
    - Configura integrações base
    - Salva setup.completed = true em yami.json
    ↓
11. Frontend: Exibe tela de sucesso com status das permissões
    ↓
12. Usuário clica "Começar a usar o Yami"
    ↓
13. Overlay desaparece
    ↓
14. Tamagotchi avatar aparece pronto para uso
    ↓
15. startVoice() é ativado automaticamente
```

---

## ⚙️ Arquivos Modificados

### `auto-panel/server.js`
- Adicionados 4 endpoints de setup
- Função para criar diretórios do YAMI
- Lógica para salvar permissões em yami.json

### `auto-panel/public/index.html`
- Adicionado CSS do onboarding (~170 linhas)
- Adicionado HTML do overlay (~20 linhas)
- Adicionado JavaScript de onboarding (~200 linhas)
- Integrado função `showPermissionsDialog()` ao settings
- Modificado fluxo de inicialização para chamar `checkOnboarding()`

---

## 🐛 Tratamento de Erros

Caso o usuário negue permissões ou ocorra erro:

1. **Erro capturado** com mensagem legível:
   - "Permissão negada pelo navegador"
   - "Você bloqueou o acesso ao microfone/câmera"
   - Mensagem de erro genérica

2. **Botão de retry**: Habilita novamente após 3 segundos

3. **Log no console**: Detalhes técnicos para debugging

---

## 📊 Armazenamento de Dados

### `yami.json` - Seção `setup`

```json
{
  "setup": {
    "completed": true,
    "completedAt": "2026-06-08T...",
    "version": "yami-native-runtime-...",
    "permissions": {
      "microphone": true,
      "notifications": true,
      "camera": false
    },
    "permissionsUpdatedAt": "2026-06-08T..."
  }
}
```

---

## 🎯 Regra da Simplicidade (PROMPT 17)

✅ **"Configuração inicial do YAMI deve ser feita em poucos passos, com permissões concentradas em um fluxo único, simples e intuitivo."**

**Implementação:**
- ✓ **Único fluxo**: Uma tela, um botão
- ✓ **Linguagem simples**: Sem termos técnicos
- ✓ **Poucos passos**: 3 cliques (abrir → confirmar → começar)
- ✓ **Permissões concentradas**: Todas em uma tela
- ✓ **Sem confirmações repetidas**: Uma autorização para todas
- ✓ **Explicações claras**: Cada permissão tem ícone, nome e descrição
- ✓ **Pronto para usar**: Tamagotchi aparece imediatamente

---

## 🚀 Próximas Melhorias Sugeridas

1. **Integração com sistema de som**: Reproduzir áudio de boas-vindas
2. **Tracking analítico**: Medir quantos usuários completam setup
3. **Setup parcial**: Permitir usuário pular e revisitar mais tarde
4. **Permissões por OS**: Adaptar lista conforme Windows/Mac/Linux
5. **Test automático**: Validar permissões periodicamente
6. **Reconexão**: Permitir reconectar contas durante setup

---

**Última atualização**: 2026-06-08
**Versão**: yami-native-runtime-20260608-4
