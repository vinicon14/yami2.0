# YAMI Desktop App (Electron)

App desktop independente para YAMI com todas as funcionalidades integradas.

## Características

- 🖥️ App desktop próprio (não precisa de navegador)
- 🎨 Interface customizada com tamagoshi
- 🎯 Setup inicial interativo com onboarding
- 🔐 Login com Google OAuth
- 🎤 Seleção de voz
- 📅 Agenda integrada
- 🔗 Integrações (WhatsApp, Telegram, Discord, Email)
- 💬 Chat em tempo real
- ⚙️ Configurações completas

## Requisitos

- Node.js v16+
- npm ou yarn
- Windows 10/11

## Instalação

### 1. Instalar dependências

```bash
cd electron
npm install
```

### 2. Desenvolvimento

```bash
npm start
```

### 3. Build para distribuição

```bash
npm run build:win
```

Isso cria um instalador em `dist/YAMI Setup 0.1.0.exe`

## Estrutura do projeto

```
electron/
├── main.js              # Processo principal do Electron
├── preload.js          # Bridge de segurança
├── package.json        # Dependências e configuração
└── app/
    ├── index.html      # Estrutura HTML
    └── app.js          # Lógica principal do app
```

## Features do Onboarding

1. **Boas-vindas** - Apresentação do YAMI
2. **Login Google** - OAuth integration
3. **Escolher Tamagoshi** - 6 opções diferentes:
   - 😊 Feliz
   - 🤖 Robot
   - 👾 Retro
   - 🐱 Gato
   - 🦄 Unicórnio
   - 🌟 Mágico

4. **Voz** - Escolher entre:
   - Google (Natural)
   - Azure (Profissional)
   - Natural (Realista)

5. **Integrações** - Conectar:
   - WhatsApp
   - Telegram
   - Discord
   - Email

6. **Conclusão** - Setup completo

## Configuração

Config salvo em: `~\AppData\Local\YAMI\yami.json`

```json
{
  "initialized": true,
  "user": {
    "name": "User",
    "email": "user@example.com",
    "tamagoshi": "😊"
  },
  "voice": "google",
  "theme": "dark",
  "integrations": ["whatsapp", "telegram"]
}
```

## Status do Tamagoshi

O tamagoshi muda de estado baseado em:
- **Energia** (0-100%)
- **Felicidade** (0-100%)
- **Aprendizado** (0-100%)

## Gateway

O app inicia automaticamente o Gateway YAMI na porta 18789 para:
- WebSocket para chat em tempo real
- Comunicação com TUI
- Gerenciamento de configurações

## Distribuição

O app é empacotado com NSIS installer que:
- Cria atalho no Desktop
- Adiciona ao Menu Iniciar
- Permite desinstalação fácil
- Cria uninstaller automático

## Problemas comuns

**App não inicia**
- Verifique Node.js: `node --version`
- Delete `node_modules` e execute `npm install`
- Verifique porta 18789 disponível

**Gateway não conecta**
- Confirm YAMI está instalado
- Verifique se C:\Users\[username]\.yami existe
- Check logs em console (F12)

## Next Steps

- [ ] Implementar Google OAuth real
- [ ] Conectar WebSocket real ao Gateway
- [ ] Implementar agenda com banco de dados
- [ ] Adicionar integração WhatsApp/Telegram
- [ ] Implementar sincronia de voz
- [ ] Adicionar temas personalizáveis
