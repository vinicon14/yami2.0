# Yami - Modulos e Arquitetura

## Visao Geral

Yami e um runtime de assistente pessoal hibrido que combina:

- **OpenClaw Runtime Core**: Motor de execucao de agentes, gateway, sistema de skills e autenticacao.
- **OpenCloud Sync**: Sincronizacao multi-dispositivo, identidade e armazenamento.
- **Hermes Agent Adapters**: Voz, memoria, permissoes e ergonomia de interacao.

## Modulos Nativos Yami

| Modulo | Nome | Descricao |
|--------|------|-----------|
| voice | Voz Yami | Ativacao por voz, TTS, estados de fala |
| dashboard | Dashboard Yami | Interface Tamagotchi full-screen |
| gateway | Gateway Yami | Roteamento de mensagens local |
| chats | Chats Yami | Sessoes de conversa por contato |
| whatsapp | WhatsApp Yami | Respostas automaticas no WhatsApp |
| integrations | Integracoes Yami | Contas Google, Microsoft, Apple, etc. |
| autoevolve | Evolucao Yami | Auto-evolucao assistida por IA |

## Modulos Nativos (Funcionalidades)

| Modulo | Nome | Descricao |
|--------|------|-----------|
| comunicacao | Comunicacao Yami | Gerenciamento de comunicacao pessoal |
| agenda-inteligente | Agenda Inteligente Yami | Calendario, lembretes, rotinas |
| gerenciamento-arquivos | Arquivos Yami | Localizar, organizar, compartilhar |
| gerenciamento-fotos | Fotos Yami | Busca contextual de fotos |
| compartilhamento-assistido | Compartilhamento Yami | Compartilhamento com confirmacao |

## Arquitetura do Pendrive

```
pendrive/
├── installer/          # Instalador .exe e scripts
├── runtime/            # Runtime portatil (Node.js + core)
│   ├── node/           # Node.js portatil
│   ├── core/           # Motor Yami (OpenClaw adaptado)
│   └── deps/           # Dependencias
├── dashboard/          # Painel de controle (auto-panel)
├── mobile/             # App Android (.apk source)
├── modules/            # Registro de modulos
│   ├── openclaw/       # Adapter OpenClaw
│   ├── opencloud/      # Adapter OpenCloud
│   └── hermes/         # Adapter Hermes
├── assets/             # Recursos visuais e sons
│   └── tamagotchi/     # Avatares Tamagotchi SVG
├── config/             # Perfis de configuracao
│   ├── profiles/       # Perfis (minimo, completo)
│   └── permissions/    # Declaracao de permissoes
├── updater/            # Sistema de atualizacao
└── docs/               # Documentacao
```

## Compatibilidade

- **Upstream**: openclaw-runtime-core, hermes-agent-adapters
- **Pendrive**: yami-pendrive-1.0
- **Sistema**: Windows 10+, macOS 13+, Linux (testado no Ubuntu 22.04+)
