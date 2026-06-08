# Yami MVP - Getting Started

Welcome to Yami MVP 0.1.0! This is a personal AI assistant runtime with voice, gateway, chats, automations and extensible integrations.

## What is Yami?

Yami is a local assistant runtime that provides:
- **Gateway**: Local HTTP API for agent interaction
- **Chats**: Message management and channel integration  
- **Voice**: Text-to-speech and voice wake word support
- **Automations**: Rule-based task automation
- **Dashboard**: Web UI for management and real-time voice interaction
- **WhatsApp Integration**: Send and receive messages via WhatsApp

## Quick Start

### Prerequisites
- Node.js 22+ (currently using v24.15.0)
- npm or pnpm
- Windows 10+

### Launching Yami

**Option 1: Using Node directly**
```bash
node C:\Users\%USERNAME%\.yami\runtime\core\yami.mjs
```

**Option 2: Using the batch launcher**
```bash
C:\Users\%USERNAME%\.yami\yami-launcher.bat
```

**Option 3: Using the PowerShell launcher**
```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\%USERNAME%\.yami\yami-launcher.ps1
```

### First Run
1. Yami will start the gateway on port 18789
2. The dashboard will be available at http://127.0.0.1:18789/
3. Configure your settings through the web UI

## Architecture

```
.yami/
├── runtime/
│   ├── core/              # Main Yami runtime (Node.js)
│   └── os_agent/          # OS integration layer (Python)
├── auto-panel/            # Web dashboard UI
├── database/              # SQLite database
├── learning-engine/       # AI learning modules
├── auth/                  # Authentication tokens
├── settings/              # User settings
└── yami.json              # Main configuration file
```

## Key Components

### Gateway (Port 18789)
- REST API for agent commands
- WebSocket support for real-time updates
- Local authentication via tokens

### Dashboard (http://127.0.0.1:18789/)
- Real-time voice interface
- Settings management
- Chat history
- Status monitoring

### Voice System
- Wake word detection: "acorda" (wake up)
- Rest word: "descansa" (rest)
- TTS via PowerShell (Windows native voices)
- Optional: Piper TTS, pyttsx3

### Channels
- WhatsApp: Send/receive messages
- Built-in chat system
- Session management

## Configuration

Edit `~/.yami/yami.json` to customize:

```json
{
  "gateway": {
    "port": 18789,
    "bind": "loopback"
  },
  "channels": {
    "whatsapp": {
      "enabled": true
    }
  },
  "plugins": {
    "entries": {
      "learning-engine": { "enabled": true },
      "browser": { "enabled": true }
    }
  }
}
```

## Building an Executable

The MVP includes multiple approaches for creating a Windows .exe:

### Current Status
- Code is committed to: https://github.com/vinicon14/yami2.0
- Batch and PowerShell launchers ready for use

### To Create a Standalone .exe

**Option 1: Using pkg (when Node 24 support is added)**
```bash
npm install -g pkg
pkg package.json -t win-x64
```

**Option 2: Using Electron (recommended for GUI)**
The project is set up to use Electron for a full desktop application with:
- Native window integration
- System tray support
- Native file dialogs
- Automatic updates

**Option 3: Creating a Setup Installer**
Use NSIS (Nullsoft Scriptable Install System) to create a professional Windows installer.

## Project Structure

### Core Runtime
- `runtime/core/` - Main Node.js application (yami.mjs)
- Built with OpenClaw architecture
- TypeScript compiled to JavaScript
- Modular plugin system

### Dashboard UI
- `auto-panel/server.js` - Express server
- `auto-panel/public/` - Static HTML/CSS
- Real-time WebSocket communication
- Responsive design for desktop/mobile

### Database
- SQLite via sql.js
- Session management
- Chat history
- Configuration storage

### Learning Engine
- User interaction tracking
- Writing style analysis
- Habit tracking
- Context learning

## Development

### Folder Structure
```
runtime/
  core/
    dist/           # Compiled JavaScript
    scripts/        # Build utilities
    skills/         # Agent skills
    yami.mjs        # Main entry point

auto-panel/
  public/           # Static assets
  server.js         # Express server
  state.json        # Runtime state

database/
  yami-db.mjs       # Database module
  sync-engine.mjs   # Sync utilities
```

### Installing Dependencies
```bash
cd ~/.yami/runtime/core
npm install

cd ~/.yami/auto-panel
npm install

cd ~/.yami/database
npm install
```

### Running Tests
```bash
npm run check         # TypeScript checking
npm run test          # Run test suite (if configured)
```

## Troubleshooting

### Port Already in Use
If port 18789 is occupied, modify `yami.json`:
```json
{
  "gateway": {
    "port": 18790
  }
}
```

### Dashboard Not Loading
1. Verify gateway is running: `curl http://127.0.0.1:18789/health`
2. Check browser console for errors
3. Clear browser cache and reload

### Voice Not Working
1. Verify audio permissions
2. Check TTS backend in settings
3. Test with: `Test Voice` button in dashboard

### WhatsApp Integration
1. Configure auth directory in `yami.json`
2. Run the setup wizard
3. Verify phone number allowlist

## Next Steps

1. **Explore the Dashboard**: http://127.0.0.1:18789/
2. **Configure Voice**: Settings → Voice
3. **Add WhatsApp**: Settings → Channels → WhatsApp
4. **Create Automation**: Settings → Automations
5. **Install Skills**: Settings → Skills

## Support & Contributing

- Repository: https://github.com/vinicon14/yami2.0
- Issues: https://github.com/vinicon14/yami2.0/issues
- Documentation: See `docs/` folder for detailed guides

## License

MIT License - See LICENSE file for details

## Version

**Yami MVP 0.1.0-yami.1**

Build Date: June 8, 2026
Node Version: 24.15.0
Platform: Windows

---

**Ready to use! Start Yami and explore the dashboard at http://127.0.0.1:18789/**
