# YAMI MVP - Personal AI Assistant Runtime

## What is YAMI?

YAMI is a personal AI assistant runtime for Windows. It's built on OpenClaw with adaptations from Hermes Agent, providing:

- **Local AI Runtime**: Runs entirely on your machine
- **Multi-Channel Support**: WhatsApp, Discord, Slack, and more
- **Voice Integration**: TTS (Text-to-Speech) and voice agent capabilities
- **Dashboard UI**: Tamagotchi-style interface (auto-panel)
- **Extensible**: Plugin architecture for custom commands and integrations

## Quick Start

### Option 1: Run the EXE (Recommended)
Simply double-click: `yami.exe`

Or from command line:
```cmd
yami.exe
```

### Option 2: Run from Original Directory
If you keep this folder inside `C:\Users\<YourUsername>\.yami\`, you can run:
```cmd
node runtime/core/yami.mjs
```

## System Requirements

- **Windows 10+** (x64)
- **Node.js v22.19+** (or v24+)
  - Download from: https://nodejs.org/
  - Required to run the YAMI runtime
- **Python 3.11+** (optional, for advanced OS agent features)
  - Download from: https://python.org/

## What's Inside

- `yami.exe` - Windows executable launcher
- `runtime/core/` - OpenClaw-based Node.js runtime
- `auto-panel/` - Dashboard UI server
- `database/` - SQLite database module
- `learning-engine/` - ML/habit tracking modules
- `auth/` - Authentication configuration
- `yami.json` - Main configuration file

## Usage

### Starting YAMI

```cmd
yami.exe
```

This launches:
1. **Node.js Runtime** - Core AI agent runtime (localhost:3000+)
2. **Auto-Panel Dashboard** - Browser UI (localhost:5173 or similar)
3. **Voice/Chat Interface** - Ready to receive messages

### Configuration

Edit `yami.json` to customize:
- AI model settings (OpenAI API keys)
- Enabled channels (WhatsApp, Discord, etc.)
- TTS preferences
- Runtime behavior

### Voice/Chat

- **WhatsApp**: Connect via Web integration
- **Voice**: Use local TTS (Windows SAPI, Piper, or pyttsx3)
- **Chat API**: Accessible via HTTP gateway

## Development

### For Development/Custom Builds

If you want to rebuild from source:

```cmd
cd runtime/core
pnpm install
pnpm build
```

Then run:
```cmd
node yami.mjs
```

## Troubleshooting

**"yami.exe not found"**
- Extract the entire release folder to `C:\Users\YourUsername\.yami\`
- Make sure you have Node.js installed

**"Node.js not found"**
- Download and install Node.js from https://nodejs.org/
- After installation, close and reopen the command prompt

**"Python not found" (if using OS agent)**
- Download and install Python 3.11+ from https://python.org/

**Port already in use**
- Edit `yami.json` to change the port numbers
- Or kill other services using those ports

## Documentation

- Original OpenClaw: https://github.com/openclaw/openclaw
- Project Structure: See `YAMI_UPSTREAMS.md`

## Version

- YAMI Version: 0.1.0-yami.1
- Based on OpenClaw (MIT)
- Node.js Runtime: v24.15.0

## Support

For issues or questions:
- Check `yami.json` configuration
- Verify Node.js installation
- Check Windows Event Viewer for runtime errors
- Review logs in `runtime/core/` directory

---

**YAMI MVP - Your Local Personal AI Assistant**
