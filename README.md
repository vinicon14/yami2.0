# YAMI — Assistente de IA Pessoal Visual e por Voz

Uma IA pessoal completa, visual, por voz, por texto e com controle profundo do computador. Fork baseado em **OpenClaw/OpenCloud** inspirado em **Hermes**.

## 🎯 Visão Geral

YAMI é um projeto que transforma a interação humano-máquina em algo natural e vivo, funcionando como um assistente pessoal verdadeiro:

- **Ativação por voz** estilo Alexa
- **Interface Tamagotchi** minimalista
- **Controle total** do computador
- **Portabilidade** via pendrive
- **Aprendizado de hábitos** contínuo
- **Comunidade descentralizada** de usuários

## 📋 Três Pilares Principais

### 1️⃣ Interação Natural e Viva
- Ativação por voz estilo Alexa
- Modo Talk com conversa natural contínua
- Feedback constante e inteligente
- Interface Tamagotchi minimalista
- Aprendizado de hábitos

### 2️⃣ Controle Total e Automação
- Acesso amplo ao computador
- Controle por voz e texto
- Integração com Codex
- Autoevolução do sistema
- WhatsApp, agenda, arquivos, fotos, login em sites, acesso remoto

### 3️⃣ Configuração Simples e Portável
- Instalação via pendrive
- APK, EXE e arquivo em um único dispositivo
- OpenClaw/OpenCloud rodando nos bastidores
- Configuração intuitiva com permissão global inicial
- Banco de dados próprio
- Personalização do Tamagotchi
- Sistema de amigos YAMI

## 🚀 Estrutura de Projeto

```
.yami/
├── README.md                          # Este arquivo
├── YAMI_18_PROMPTS.md                 # 18 prompts conceituais para Codex
├── ARCHITECTURE.md                    # Arquitetura técnica
├── docs/                              # Documentação detalhada
│   ├── INSTALLATION.md                # Guia de instalação
│   ├── VOICE_ACTIVATION.md            # Sistema de wake-word
│   ├── TAMAGOTCHI_UI.md               # Interface visual
│   ├── AUTOMATION.md                  # Sistema de automação
│   └── API_INTEGRATION.md             # Integração com APIs
├── src/                               # Código-fonte
│   ├── core/                          # Núcleo da IA
│   │   ├── voice_engine.py            # Motor de voz
│   │   ├── llm_integration.py         # Integração com OpenClaw
│   │   └── context_manager.py         # Gerenciamento de contexto
│   ├── ui/                            # Interface gráfica
│   │   ├── tamagotchi.py              # Avatar minimalista
│   │   └── chat_interface.py          # Interface de chat
│   ├── automation/                    # Sistema de automação
│   │   ├── task_executor.py           # Executor de tarefas
│   │   └── habit_learner.py           # Aprendizado de hábitos
│   ├── integrations/                  # Integrações externas
│   │   ├── whatsapp.py                # Integração WhatsApp
│   │   ├── calendar.py                # Integração calendário
│   │   └── file_manager.py            # Gerenciador de arquivos
│   └── main.py                        # Ponto de entrada
├── config/                            # Configurações
│   ├── yami.conf.json                 # Configurações padrão
│   └── models/                        # Modelos de IA
├── tests/                             # Testes
│   ├── test_voice.py
│   ├── test_automation.py
│   └── test_ui.py
├── build/                             # Arquivos de build
│   ├── windows/                       # Build para Windows (.exe)
│   ├── macos/                         # Build para macOS
│   ├── linux/                         # Build para Linux
│   └── android/                       # Build para Android (.apk)
├── requirements.txt                   # Dependências Python
├── setup.py                           # Setup do projeto
└── .gitignore                         # Arquivos ignorados
```

## 🏗️ Arquitetura Técnica

### Componentes Principais

1. **Motor de Voz**
   - Wake-word detection ("YAMI")
   - Speech-to-text em tempo real
   - Text-to-speech natural
   - Múltiplas vozes

2. **Motor de IA**
   - OpenClaw (LLM local ou remoto)
   - Gerenciamento de contexto
   - Processamento de linguagem natural
   - Aprendizado contínuo

3. **Automação**
   - Executor de tarefas
   - Aprendizado de hábitos
   - Macros e scripts customizáveis
   - Integração com Codex

4. **Interface**
   - Avatar Tamagotchi animado
   - Chat textual
   - Indicadores de estado
   - Configurações personalizáveis

5. **Integrações**
   - WhatsApp (via API)
   - Google Calendar
   - Sistema de arquivos
   - Aplicativos locais

## 📦 Dependências Principais

- **OpenClaw** - Motor de LLM
- **OpenCloud** - Sincronização pessoal
- **Hermes** - Camada de integração
- **Python 3.10+** - Runtime
- **PyAudio** - Processamento de áudio
- **PyQt6** - Interface gráfica
- **SQLite** - Banco de dados

## 🔧 Setup Rápido

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/yami.git
cd yami

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instale dependências
pip install -r requirements.txt

# Execute
python src/main.py
```

## 📝 18 Prompts Conceituais

O projeto é baseado em 18 prompts conceituais que formam a base para enviar ao Codex:

1. **Ativação e Responsividade por Voz**
2. **Modo Talk — Conversa Natural**
3. **Interface Tamagotchi Minimalista**
4. **Feedback Constante e Inteligente**
5. **Aprendizado de Hábitos**
6. **Integração Multimodal (Voz, Texto, Gestos)**
7. **Acesso ao Sistema Operacional**
8. **Integração com WhatsApp, Agenda e Arquivos**
9. **Login Automatizado e Seguro**
10. **Automação com Codex**
11. **Acesso Remoto e Sincronização**
12. **Autoevolução do Sistema**
13. **Instalação via Pendrive**
14. **APK, EXE e Componentes Integrados**
15. **OpenClaw/OpenCloud no Backend**
16. **Banco de Dados Pessoal e Privado**
17. **Personalização Visual do Tamagotchi**
18. **Sistema de Amigos YAMI (Redes Descentralizadas)**

Veja [YAMI_18_PROMPTS.md](YAMI_18_PROMPTS.md) para detalhes completos.

## 🗓️ Roadmap

### Fase 1: MVP (Semanas 1-4)
- [ ] Ativação por voz funcionando
- [ ] Interface Tamagotchi básica
- [ ] Chat com OpenClaw integrado
- [ ] Instalação em pendrive

### Fase 2: Controle (Semanas 5-8)
- [ ] Sistema de automação
- [ ] Integração WhatsApp
- [ ] Aprendizado de hábitos
- [ ] Controle do SO

### Fase 3: Portabilidade (Semanas 9-12)
- [ ] Build para Windows/Mac/Linux
- [ ] APK para Android
- [ ] Sincronização entre dispositivos
- [ ] Beta público

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões e ideias são bem-vindas!

## 📄 Licença

MIT License - veja LICENSE para detalhes.

## 📮 Contato

Para dúvidas ou sugestões sobre o projeto YAMI, abra uma issue no GitHub.

---

**Status**: 🚀 Em desenvolvimento (MVP em progresso)
