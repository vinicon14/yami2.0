# YAMI Pendrive Installer - Plug-and-Play Edition

```
    ╔══════════════════════════════════════════╗
    ║      YAMI - Assistente Pessoal           ║
    ║   Instalacao Plug-and-Play via Pendrive  ║
    ║         Versao 1.0.0-pendrive            ║
    ╚══════════════════════════════════════════╝
```

## O que e o YAMI?

**YAMI** e um assistente pessoal IA que aparece na sua tela como um **Tamagotchi digital**:

- 🎤 **Comando de voz**: Diga "Acorda Yami" para ativar
- 💻 **Interface amigavel**: Dashboard intuitivo com avatar animado
- 📱 **WhatsApp integrado**: Responde automaticamente via WhatsApp
- 🗂️ **Gerenciamento**: Arquivos, fotos, agenda, comunicacao
- 🔐 **Privacidade**: Roda localmente, sem rastreamento
- 🚀 **Zero config**: Instalacao plug-and-play sem terminal

## Instalacao Rapida (3 Minutos)

### Passo 1: Conectar Pendrive
Conecte este pendrive YAMI ao computador. O instalador abre automaticamente.

### Passo 2: Assistente de Configuracao
O instalador guia voce em 5 passos simples:
1. **API OpenAI** (necessaria para o cerebro IA)
2. **Contas** (WhatsApp, Google - opcionais)
3. **Permissoes** (microfone, auto-start - autorizar)
4. **Instalacao** (automatica - aguarde 1 minuto)
5. **Pronto!** (Yami aparece na tela)

### Passo 3: Usar
- Diga **"Acorda Yami"** para ativar
- O Tamagotchi da Yami responde na tela
- Configure em: [http://127.0.0.1:18808/](http://127.0.0.1:18808/)

## Estrutura do Pendrive

```
YAMI/
├── YamiInstaller.exe             ← Clique aqui para instalar
├── autorun.inf                   ← Auto-executa no Windows
├── installer/
│   ├── YamiInstaller.ps1         ← Script principal (pode rodar diretamente)
│   └── start-yami.bat            ← Inicia o dashboard
├── runtime/
│   ├── yami-pendrive-bootstrap.mjs
│   ├── yami-manifest.json
│   ├── node/                     ← Node.js portatil
│   ├── core/                     ← Motor Yami (copiado na instalacao)
│   └── deps/                     ← Dependencias
├── dashboard/
│   ├── setup-wizard.html         ← Assistente de config
│   ├── YamiPendriveLoader.ps1
│   └── public/                   ← Interface Tamagotchi (copiada)
├── mobile/
│   └── YamiApp/                  ← Codigo fonte do app Android
├── modules/
│   ├── openclaw/                 ← Adaptador OpenClaw
│   ├── opencloud/                ← Adaptador OpenCloud
│   ├── hermes/                   ← Adaptador Hermes
│   └── registry.json             ← Registro de modulos
├── assets/
│   └── tamagotchi/               ← Avatares SVG e ícone
├── config/
│   ├── profiles/                 ← Perfis (minimo, completo)
│   ├── permissions/              ← Declaracao de permissoes
│   └── *.json                    ← Configuracoes padroes
├── updater/
│   └── YamiUpdater.ps1           ← Sistema de atualizacao
├── scripts/
│   ├── build-pendrive.ps1        ← Monta o pendrive
│   ├── compile-installer.ps1     ← Compila .exe
│   └── deploy-to-usb.ps1         ← Deploy em USB
├── docs/
│   ├── GUIA_RAPIDO.md
│   ├── INSTALACAO.md
│   └── MODULOS.md
└── VERSION                       ← Versao atual
```

## Primeiro Uso

### Comando de Ativacao
```
"Acorda Yami"
```
Yami acorda e comeca a escutar comandos.

### Comandos Rapidos
- "Abre Spotify" → Abre o Spotify
- "Abre YouTube" → Abre o YouTube
- "Abre navegador" → Abre o navegador
- "Abre calculadora" → Abre calculadora
- "Status Yami" → Verifica status

### Dashboard
Acesse em qualquer navegador:
```
http://127.0.0.1:18808/
```

Funcionalidades:
- 🎤 **Voz Yami**: Controlar microfone, ajustar velocidade/volume
- 💬 **Chats**: Ver conversas e sessoes
- 🤖 **WhatsApp**: Configurar numero e auto-resposta
- ⚙️ **Gateway**: Status do servidor local
- 🔌 **Integracoes**: Conectar Google, Microsoft, Apple
- 🎨 **Aparencia**: Customizar Tamagotchi

## Mudancas Necessarias: Nada!

O YAMI Pendrive ja vem configurado com:

| O que poderia ser complicado | Como o YAMI resolve |
|------------------------------|----------------------|
| Instalar Node.js | Incluso no pendrive (portatil) |
| Clonar repositorio | Ja inclusos todos os arquivos |
| npm install | Ja feito (shrinkwrap.json) |
| Configurar localhost | Automatico (127.0.0.1:18808) |
| Editar variáveis de ambiente | Nao e necessario |
| Usar terminal/PowerShell | Interface visual (HTML) |
| Abrir portas de rede | Automatico (loopback) |
| Conectar APIs manualmente | Assistente de config |
| Criar atalhos | Automatico (Inicializar Windows) |

## Recursos Principais

### Modulos Inclusos

- **OpenClaw Adapter**: Motor de agentes, gateway, skills
- **OpenCloud Sync**: Sincronizacao entre dispositivos
- **Hermes Adapters**: Voz, memoria, permissoes
- **Yami Native**: Comunicacao, agenda, arquivos, fotos, compartilhamento

### Tamagotchi Avatar

O Yami aparece como um Tamagotchi digital na sua tela com estados visuais:

- 😴 **Sleeping**: Dormindo (descansando)
- 😊 **Passive**: Em espera, ouvindo passivamente
- 👂 **Listening**: Escutando comando de voz
- ⚙️ **Processing**: Processando seu pedido
- 💬 **Speaking**: Respondendo
- 😍 **Happy**: Completando tarefas com sucesso
- ⚠️ **Error**: Erro de conexao ou permissao

### Atualizacoes Automaticas

O YAMI verifica atualizacoes:
- Toda semana (domingo 03:00)
- Ao iniciar o Windows
- Manualmente: `updater\YamiUpdater.ps1 -Check -Apply`

### Multi-Dispositivo

Com OpenCloud Sync:
- Perfil sincronizado entre PCs
- Historico de conversas
- Configuracoes na nuvem (opcional)

## Requisitos Minimos

| Componente | Minimo | Recomendado |
|-----------|--------|------------|
| **OS** | Windows 7+ | Windows 10+ (64-bit) |
| **RAM** | 2 GB | 4 GB+ |
| **Disco** | 500 MB | 2 GB+ |
| **Internet** | Nao | Sim (para APIs) |
| **Microfone** | Nao | Sim (para voz) |

## Solucao de Problemas

### Instalador nao abre

1. Conecte o pendrive
2. Abra Windows Explorer
3. Clique com botao direito em `YamiInstaller.exe`
4. Execute como administrador

### Voz nao funciona

1. Windows > Configuracoes > Privacidade > Microfone
2. Ative acesso ao microfone
3. Reinicie o Yami: `start-yami.bat`

### Dashboard nao abre

```powershell
# Terminal (PowerShell) como admin:
$YAMI_HOME = "$env:USERPROFILE\.yami"
node "$YAMI_HOME\auto-panel\server.js"
```

Depois acesse: http://127.0.0.1:18808/

### WhatsApp nao conecta

1. Dashboard > Integracoes > WhatsApp
2. Clique em "Conectar"
3. Escaneie o QR code com seu telefone
4. Aprove o acesso

### Erro "API Key invalida"

1. Gere uma chave em: https://platform.openai.com/api-keys
2. Dashboard > Integracoes > OpenAI
3. Cole a chave e clique em "Salvar"

## Compilar Instalador .exe

O arquivo `YamiInstaller.ps1` pode ser compilado para .exe:

```powershell
# Com ps2exe (recomendado)
Install-Module -Name ps2exe -Force
ps2exe "installer\YamiInstaller.ps1" "installer\YamiSetup.exe" -noConsole

# Ou execute o script de compilacao
.\scripts\compile-installer.ps1
```

## Desinstalacao

```powershell
# 1. Remova o atalho de inicializacao
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Yami.lnk"

# 2. Desregistre tarefas agendadas
Get-ScheduledTask -TaskName "Yami-*" | Unregister-ScheduledTask -Confirm:$false

# 3. Remova a pasta
Remove-Item -Recurse -Force "$env:USERPROFILE\.yami"
```

## Configuracao Avancada

### Perfis de Configuracao

- **minimal.json**: Apenas voz local
- **complete.json**: Todas as funcionalidades

Ative em: `config/profiles/`

### Permissoes Customizadas

Edite: `config/permissions/default.json`

### Modulos Adicionais

Adicione em: `modules/` e atualize `modules/registry.json`

## Arquitetura

```
Pendrive Installer
  ├── YamiInstaller.ps1
  ├── YamiInstaller.exe (compilado)
  └── autorun.inf
        ↓
   [Instalacao]
        ↓
    ~/.yami/
      ├── runtime/core/        (OpenClaw + Hermes + OpenCloud)
      ├── auto-panel/          (Dashboard Tamagotchi)
      ├── modules/             (Extensoes)
      ├── yami.json            (Configuracao gerada)
      └── updater/             (Sistema de atualizacao)
        ↓
   [Execucao]
        ↓
    [Gateway Yami] ←→ [Dashboard] ←→ [Auto-panel Server]
         ↓
    [Agente Yami]  ←→ [OpenAI/Local Model]
         ↓
    [Modulos Ativos]
      - Voz (Wake: acorda)
      - WhatsApp
      - Integracoes
      - Memoria
      - Agenda
```

## Licenca

- **Yami**: MIT (propriedade do projeto)
- **OpenClaw**: MIT (copyright OpenClaw Foundation)
- **Hermes**: MIT (copyright Nous Research)
- **OpenCloud**: MIT (sync framework)

Veja `LICENSE` no pendrive.

## Suporte e Feedback

- **Documentacao**: `docs/` no pendrive
- **Dashboard**: http://127.0.0.1:18808/
- **Issues**: GitHub (quando disponivel)

---

**Yami v1.0.0-pendrive** | Plug-and-Play Personal Assistant Runtime
Instalacao por pendrive sem configuracao manual · Zero terminal · Tamagotchi assistant
