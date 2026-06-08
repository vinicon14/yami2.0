# YAMI — Arquitetura Técnica

## 📐 Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAMADA DE INTERFACE                         │
│                  (UI Tamagotchi + Chat + Voz)                   │
└────────┬─────────────────────────────────────────────────────┬──┘
         │                                                      │
    ┌────▼─────┐                                         ┌─────▼──┐
    │   Voice  │                                         │  Chat  │
    │  Engine  │                                         │ UI     │
    └────┬─────┘                                         └─────┬──┘
         │                                                      │
└────────┴──────────────────────────────────────────────────────┴──┐
│                  CAMADA DE PROCESSAMENTO                        │
│              (NLP, Context, Decision Making)                    │
└────────┬──────────────────────────────────────────────────────┬──┘
         │                                                      │
    ┌────▼──────────────┐                          ┌────────────▼──┐
    │   LLM Integration │                          │  Habit        │
    │  (OpenClaw)       │                          │  Learner      │
    └────┬──────────────┘                          └────────────┬──┘
         │                                                      │
└────────┴──────────────────────────────────────────────────────┴──┐
│                   CAMADA DE AUTOMAÇÃO                           │
│              (Task Executor, Codex Integration)                 │
└────────┬──────────────────────────────────────────────────────┬──┘
         │                                                      │
    ┌────▼────────────┐                          ┌─────────────▼──┐
    │  Task Executor  │                          │  Codex Client  │
    └────┬────────────┘                          └─────────────┬──┘
         │                                                      │
└────────┴──────────────────────────────────────────────────────┴──┐
│                CAMADA DE INTEGRAÇÕES EXTERNAS                   │
│         (WhatsApp, Calendar, Files, APIs, Remote Control)       │
└────────┬────────────────┬──────────────────┬────────────────────┘
         │                │                  │
    ┌────▼──┐      ┌──────▼──┐      ┌───────▼──┐
    │WhatsApp│      │Calendar │      │  Files   │
    └─────────┘      └─────────┘      └──────────┘
         │                │                  │
└────────┴────────────────┴──────────────────┴──────────────────────┐
│                   CAMADA DE DADOS & PERSISTÊNCIA                 │
│            (Database, Cache, Settings, Offline Storage)          │
│                                                                  │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  SQLite DB  │  │  Config  │  │  Cache   │  │  Local LLM   │ │
│  │ (Histórico) │  │ (YAMI)   │  │ (Redis)  │  │ (OpenClaw)   │ │
│  └─────────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

## 🔧 Componentes Detalhados

### 1. Camada de Interface (UI Layer)

#### Voice Engine
- **Responsabilidade**: Capturar e processar áudio
- **Componentes**:
  - `WakeWordDetector`: Detecta "YAMI"
  - `SpeechRecognizer`: Converte fala em texto
  - `TextToSpeech`: Converte texto em fala
  - `AudioBuffer`: Buffer circular de áudio

#### Tamagotchi UI
- **Responsabilidade**: Renderizar avatar e estado visual
- **Componentes**:
  - `AvatarRenderer`: Desenha avatar animado
  - `StateIndicator`: Mostra estado (pensando, ouvindo, etc)
  - `AnimationEngine`: Gerencia animações
  - `ThemeManager`: Gerencia cores e temas

#### Chat UI
- **Responsabilidade**: Interface textual
- **Componentes**:
  - `ChatWindow`: Janela de chat
  - `InputHandler`: Processa entrada de usuário
  - `MessageRenderer`: Renderiza mensagens

### 2. Camada de Processamento (Processing Layer)

#### LLM Integration
- **Responsabilidade**: Processar linguagem natural
- **Componentes**:
  - `OpenClawClient`: Cliente para OpenClaw
  - `ContextManager`: Gerencia contexto de conversa
  - `PromptBuilder`: Constrói prompts otimizados
  - `ResponseParser`: Parseia respostas do LLM

#### Habit Learner
- **Responsabilidade**: Aprender padrões do usuário
- **Componentes**:
  - `PatternDetector`: Identifica padrões
  - `HabitTracker`: Rastreia hábitos
  - `PredictionEngine`: Prediz ações
  - `RecommendationEngine`: Sugere automações

### 3. Camada de Automação (Automation Layer)

#### Task Executor
- **Responsabilidade**: Executar tarefas automatizadas
- **Componentes**:
  - `TaskScheduler`: Agenda tarefas
  - `TaskExecutor`: Executa tarefas
  - `ActionRegistry`: Registro de ações disponíveis
  - `ErrorHandler`: Trata erros e retry

#### Codex Integration
- **Responsabilidade**: Gerar código via Codex
- **Componentes**:
  - `CodexClient`: Cliente para Codex
  - `CodeGenerator`: Gera scripts
  - `CodeValidator`: Valida código gerado
  - `SandboxExecutor`: Executa em sandbox

### 4. Camada de Integrações Externas

#### WhatsApp Integration
- **Responsabilidade**: Ler/enviar mensagens
- **Componentes**:
  - `WhatsAppClient`: Cliente API WhatsApp
  - `MessageProcessor`: Processa mensagens
  - `ContactManager`: Gerencia contatos

#### Calendar Integration
- **Responsabilidade**: Gerenciar eventos
- **Componentes**:
  - `CalendarClient`: Cliente Google Calendar
  - `EventParser`: Parseia eventos
  - `ReminderEngine`: Gerencia lembretes

#### File Manager
- **Responsabilidade**: Navegar e organizar arquivos
- **Componentes**:
  - `FileExplorer`: Navega sistema de arquivos
  - `FileIndexer`: Indexa arquivos (busca rápida)
  - `PhotoGallery`: Gerencia fotos

#### System Control
- **Responsabilidade**: Controlar SO
- **Componentes**:
  - `ProcessManager`: Gerencia processos
  - `WindowManager`: Gerencia janelas
  - `HotkeyManager`: Gerencia atalhos
  - `SystemMonitor`: Monitora recursos

### 5. Camada de Dados (Data Layer)

#### Database
```sql
-- Tabelas principais
CREATE TABLE chats (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    user_message TEXT,
    ai_response TEXT,
    context_data JSON
);

CREATE TABLE habits (
    id INTEGER PRIMARY KEY,
    pattern TEXT,
    frequency INTEGER,
    last_triggered DATETIME,
    automation_json JSON
);

CREATE TABLE credentials (
    id INTEGER PRIMARY KEY,
    service TEXT,
    encrypted_data BLOB
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

#### Configuration
- `yami.conf.json`: Configurações principais
- `voice.conf.json`: Configurações de voz
- `automation.conf.json`: Regras de automação

## 🔄 Fluxos de Dados Principais

### Fluxo 1: Comando por Voz
```
Áudio Capturado
    ↓
Wake-Word Detection ("YAMI")
    ↓
Speech-to-Text (transcrição)
    ↓
LLM Processing (OpenClaw)
    ↓
Intent Recognition + Action Planning
    ↓
Task Execution (se aplicável)
    ↓
Response Generation (texto + voz)
    ↓
User Feedback
```

### Fluxo 2: Aprendizado de Hábitos
```
Ação do Usuário Observada
    ↓
Pattern Matching
    ↓
Habit Detection + Frequency Analysis
    ↓
Prediction Model Update
    ↓
Suggestion ao Usuário
    ↓
Feedback do Usuário → Loop de Aprendizado
```

### Fluxo 3: Automação com Codex
```
Comando do Usuário (ex: "Automatize X")
    ↓
Natural Language Understanding
    ↓
Codex Code Generation
    ↓
Code Validation + Sandboxing
    ↓
User Approval
    ↓
Task Registration
    ↓
Execution
```

## 🔐 Segurança

### Princípios
- **Criptografia End-to-End**: Dados sensíveis criptografados
- **Controle Local**: Dados armazenados localmente por padrão
- **Permissões Granulares**: Controle fino sobre capabilidades
- **Sandbox Execution**: Código gerado executado em sandbox

### Implementação
```python
# Encryption exemplo
from cryptography.fernet import Fernet

class CredentialManager:
    def __init__(self):
        self.cipher = Fernet(key)
    
    def store_credential(self, service, credential):
        encrypted = self.cipher.encrypt(credential.encode())
        db.store(service, encrypted)
    
    def retrieve_credential(self, service):
        encrypted = db.retrieve(service)
        return self.cipher.decrypt(encrypted).decode()
```

## 📦 Dependências de Implementação

```
yami/
├── Core Dependencies:
│   ├── python-openai (OpenClaw)
│   ├── pydub (Áudio)
│   ├── pyaudio (Captura de áudio)
│   ├── pyttsx3 (Text-to-Speech)
│   └── sqlalchemy (ORM)
│
├── UI Dependencies:
│   ├── PyQt6 (Interface)
│   └── matplotlib (Gráficos)
│
├── Integration Dependencies:
│   ├── whatsapp-web.py (WhatsApp)
│   ├── google-api-python-client (Calendar)
│   ├── requests (HTTP)
│   └── selenium (Web automation)
│
└── Utilities:
    ├── python-dotenv (Configurações)
    ├── pydantic (Validação)
    └── pytest (Testes)
```

## 🚀 Deployment

### Local (Pendrive)
- Executável único (PyInstaller)
- Banco de dados SQLite no mesmo diretório
- Modelos de IA armazenados localmente

### Web
- API REST (FastAPI)
- Frontend em React/Vue
- Sincronização com OpenCloud

### Mobile
- APK para Android (Kivy)
- App nativo para iOS
- Sincronização com servidor YAMI

## 🔄 Ciclo de Desenvolvimento

1. **Prototipagem**: Codar funcionalidade
2. **Teste Local**: Validar em sandbox
3. **Build**: Criar executáveis
4. **Deploy**: Disponibilizar em plataformas
5. **Feedback**: Coletar dados de uso
6. **Otimização**: Melhorar baseado em feedback

---

**Última atualização**: Junho 2026
