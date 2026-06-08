# YAMI Writing Style - Quick Start Guide

## 🎯 What This Does

YAMI now learns **how you write** and can reproduce your authentic writing style whenever you ask.

It analyzes:
- Your vocabulary (formal/technical/casual)
- Your typical tone (professional/casual/funny/etc.)
- Your common phrases and expressions
- How you greet and sign off
- Your emoji usage
- Your sentence structure
- And more...

Then, when you ask YAMI to "write in my style", it generates responses that sound genuinely like you.

## ⚡ 30-Second Setup

### Option 1: PowerShell (Windows)
```powershell
cd C:\Users\vinim\.yami
.\estilo_cli.ps1 status
```

### Option 2: Python (Any Platform)
```bash
cd ~/.yami
python -m estilo status
```

You should see:
```
Status: ATIVADO
Mensagens analisadas: 0
```

Done! ✅

## 📝 Teaching YAMI Your Style

Send 3-5 example messages for analysis:

```bash
python -m estilo update "Opa, tudo bem? Como vai você?"

python -m estilo update "Tipo, achei muito interessante demais! Vamos explorar?"

python -m estilo update "Valeu pela ajuda, cara! Fez toda diferença mesmo 😄"
```

After each one, YAMI learns a bit more about your style.

## 👀 View Your Profile

```bash
python -m estilo status
```

You'll see:
```
Descrição: estilo casual, tom entusiasmado, mensagens médias
Formalidade: casual
Tom principal: entusiasmado
Expressões recorrentes: tipo, vamos, valeu
Cumprimento típico: "opa"
```

## 🤖 See What AI Will Use

```bash
python -m estilo view-section
```

This shows the exact section injected into YAMI's AI system prompt. It includes all the patterns we detected.

## 💬 Use Your Style

Now ask YAMI:

**"Reply in my style"** or **"Write like me"** or **"Respond in my writing style"**

YAMI will generate a response that sounds authentically like you.

## ✏️ Adjust Your Profile

### Manually edit your style:
```bash
python -m estilo edit '{"formality": "formal", "primaryTone": "profissional"}'
```

### Reset everything and start fresh:
```bash
python -m estilo reset
```

### Disable the system:
```bash
python -m estilo disable
```

### Re-enable:
```bash
python -m estilo enable
```

## 📚 Full Documentation

See the detailed guides:
- `estilo/README.md` - Complete reference
- `ESTILO_INTEGRATION.md` - Technical details
- `ESTILO_IMPLEMENTATION_SUMMARY.md` - What was built

## 🎮 Common Scenarios

### Scenario 1: Reply to a WhatsApp Message
```
Friend: "Hey, how's the project going?"

You: "YAMI, reply in my style"

YAMI: "Opa! Tá indo bem, achei bem interessante mesmo. 
       Tipo, vamos explorar mais as ideias."
```

### Scenario 2: Write an Email
```
You: "Write a professional email to my boss about the project, 
      but in my writing style"

YAMI: [Generates email with your tone + formality level]
```

### Scenario 3: Auto-Reply Message
```
You: "Create an auto-reply for when I'm busy, in my style"

YAMI: [Generates reply that sounds like you]
```

## 🔒 Privacy & Control

- ✅ All data stored locally (in `~/.yami/pendrive/`)
- ✅ No cloud, no external APIs
- ✅ You see everything YAMI learned
- ✅ You can edit or reset anytime
- ✅ You control when it's used

## ❓ Troubleshooting

### Commands not working?
```bash
# Check if Python is installed
python --version

# Check if we're in the right directory
cd ~/.yami

# Try again
python -m estilo status
```

### Profile shows "no messages analyzed"?
```bash
# Teach it with an example
python -m estilo update "your message here"

# Check again
python -m estilo status
```

### AI not using your style?
1. Make sure profile is enabled: `estilo status`
2. Explicitly ask: "Write in my style"
3. The more messages you analyze, the better it gets

### Want to start fresh?
```bash
python -m estilo reset
python -m estilo update "new sample"
python -m estilo update "another sample"
```

## 💡 Tips

1. **Teach by example**: The more messages you analyze, the better YAMI learns
2. **Be authentic**: Use your real messages, not artificial ones
3. **Check the profile**: Run `status` to see what was learned
4. **Adjust manually**: Don't like what was detected? Edit it with `edit`
5. **Ask explicitly**: Say "in my style" when you want it applied

## 📋 Command Cheat Sheet

```bash
# View current profile
estilo status

# Analyze a text
estilo analyze "your text"

# Teach YAMI (analyze + update)
estilo update "your message"

# See what AI will use
estilo view-section

# Manually adjust
estilo edit '{"formality": "casual"}'

# Start over
estilo reset

# Toggle on/off
estilo enable
estilo disable

# Get help
estilo help
```

## 🚀 Next Steps

1. **Teach YAMI your style**:
   ```bash
   python -m estilo update "Send 3-5 real messages from you"
   ```

2. **Check your profile**:
   ```bash
   python -m estilo status
   ```

3. **Ask YAMI to use it**:
   ```
   "Reply in my style"
   "Write like me"
   "Use my writing style for: [task]"
   ```

4. **Refine as needed**:
   ```bash
   python -m estilo edit '{...}'
   ```

---

## Questions?

See the full documentation:
- 📖 `estilo/README.md` - Full reference
- 🔧 `ESTILO_INTEGRATION.md` - How it works
- 📊 `ESTILO_IMPLEMENTATION_SUMMARY.md` - Technical details

**System Status**: ✅ Ready to use  
**Version**: 1.0.0  
**Version Date**: 2026-06-08

---

That's it! YAMI is now learning how you write. Start teaching it by sending messages, and it will adapt to your authentic style over time.

Happy writing! ✨
