# YAMI Pendrive Identity System — Complete Guide

## 📖 Overview

The YAMI Pendrive is the **permanent digital nucleus** of your Yami assistant. It stores:
- Your unique Yami identity
- Personalization & appearance settings
- Evolution history & milestones
- Social connections & messages
- Local memory & learning data
- Voice preferences & configurations

Everything is stored in `~/.yami/pendrive/` and can be moved to a USB drive for **true portability**.

---

## 🚀 Quick Start

### Initialize Your Pendrive

**Via CLI:**
```bash
node C:\Users\vinim\.yami\runtime\pendrive-cli.mjs init
```

**Via Web Dashboard:**
1. Open menu → "Pendrive"
2. Click "Inicializar"
3. Your Yami will be born with a unique ID

### Check Your Identity

```bash
node C:\Users\vinim\.yami\runtime\pendrive-cli.mjs whoami
```

Output:
```
Yami
ID: ymi-mq5kti8l-8846c0baae22bad1
Geracao: 1
```

---

## 🎨 Customization Examples

### Change Yami's Appearance

**Web Dashboard:**
1. Menu → "Pendrive"
2. Select theme, eyes, glow color
3. Click "Aplicar personalizacao"

**CLI:**
```bash
# Change theme
node pendrive-cli.mjs appearance theme violet-haze

# Change eye style
node pendrive-cli.mjs appearance eyes happy

# Change glow color
node pendrive-cli.mjs appearance glow pink

# Set custom accessory
node pendrive-cli.mjs appearance accessory crown
```

### Available Customizations

**Themes:**
- `dark-neon` - Classic cyan neon
- `cyber-blue` - Deep blue cyberpunk
- `sunset-amber` - Warm orange glow
- `violet-haze` - Purple mystique
- `forest-green` - Nature green
- `midnight-ocean` - Deep ocean blue

**Eye Styles:**
- `default` - Standard eyes
- `happy` - Closed happy eyes
- `sleepy` - Dreamy sleepy eyes
- `cyborg` - Robotic cyber eyes
- `starry` - Starfield eyes
- `fire` - Flaming eyes

**Glow Colors:**
- `cyan`, `amber`, `green`, `red`, `violet`, `pink`, `blue`

---

## 📝 Profile Management

### Update Your Profile

```bash
# Set display name
node pendrive-cli.mjs profile set displayName "Meu Yami Especial"

# Add bio
node pendrive-cli.mjs profile set bio "Assistente digital inteligente"

# Set social handle
node pendrive-cli.mjs profile set socialHandle "@meuYami"

# View profile
node pendrive-cli.mjs profile
```

### Profile Structure

```json
{
  "displayName": "Yami",
  "userName": "",
  "avatar": "default",
  "bio": "Seu assistente digital",
  "timezone": "America/Sao_Paulo",
  "language": "pt-BR",
  "region": "BR",
  "theme": "dark-neon"
}
```

---

## 🧬 Evolution System

### Register Evolution Events

```bash
# Simple evolution
node pendrive-cli.mjs evolution register "usuario-aprendeu-comando" "Usuário treinou novo comando de voz"

# Advance to new stage
node pendrive-cli.mjs evolution stage "adolescente" "Yami Adolescente" "Forma intermediária mais inteligente"
```

### Evolution Stages

Each Yami progresses through stages:
- **Primordial** → Initial form
- **Adolescent** → Growing (future)
- **Mature** → Intelligent (future)
- **Transcendent** → Ultimate (future)

### View Evolution History

```bash
node pendrive-cli.mjs evolution
```

Output:
```
generation: 1
currentStage: primordial
totalEvolutions: 5
lastEvolutionAt: 2026-06-08T19:15:22.345Z

Recent evolutions:
- usuario-aprendeu-comando: Usuário treinou novo comando de voz
- modulo-instalado: Novo módulo foi instalado
- nascimento: Yami foi inicializado com identidade pendrive
```

---

## 👥 Social Network

### Add Friends

```bash
# Add a friend
node pendrive-cli.mjs friends add "ymi-amigo-001" "Seu Amigo"

# View friend list
node pendrive-cli.mjs friends list

# Send friend invitation
node pendrive-cli.mjs friends invite "ymi-outro-yami-001" "Olá! Quer ser meu amigo?"

# Accept invitation
node pendrive-cli.mjs friends accept "ymi-outro-yami-001"

# View pending requests
node pendrive-cli.mjs friends requests

# Remove friend
node pendrive-cli.mjs friends remove "ymi-amigo-001"
```

### Send Messages

```bash
# Send message to friend
node pendrive-cli.mjs messages send "ymi-amigo-001" "Oi! Tudo bem?"

# View message history
node pendrive-cli.mjs messages list

# Messages with specific friend
node pendrive-cli.mjs messages list "ymi-amigo-001"
```

### Message Structure

```json
{
  "id": "msg-mq5kti8l-b1b07b4b",
  "direction": "outgoing|incoming",
  "text": "Message content",
  "timestamp": "2026-06-08T19:15:22.345Z",
  "read": false
}
```

---

## 🧠 Memory Bank

### Add Memories

```bash
# Add simple note
node pendrive-cli.mjs memory add "Usuário prefere assistência matinal"

# Add tagged memory
node pendrive-cli.mjs memory add "Hora ideal: 7am para ativar Yami"

# Search memories
node pendrive-cli.mjs memory search "matinal"

# View all memories
node pendrive-cli.mjs memory list
```

### Memory Structure

```json
{
  "id": "mem-mq5kti8l-b1b07b4b",
  "type": "note",
  "content": "Usuário prefere assistência matinal",
  "tags": [],
  "createdAt": "2026-06-08T19:15:22.345Z",
  "accessCount": 5
}
```

### Memory Capacity

- **Maximum entries:** 10,000 per Yami instance
- **Searchable:** By content and tags
- **Permanent:** Stored in local pendrive
- **Expandable:** Can use with vector DBs in future

---

## 📤 Backup & Export

### Export Your Identity

```bash
# Export complete bundle
node pendrive-cli.mjs export > yami-backup-2026-06-08.json

# Via Web Dashboard
# Pendrive page → "Exportar Identidade"
```

### Export Bundle Contents

```json
{
  "exportedAt": "2026-06-08T19:15:22.345Z",
  "origin": "ymi-mq5kti8l-8846c0baae22bad1",
  "bundle": {
    "identity": { /* unique ID and metadata */ },
    "profile": { /* user profile */ },
    "appearance": { /* customization */ },
    "evolution": { /* history and stages */ },
    "modules": { /* installed modules */ },
    "voice": { /* voice settings */ },
    "socialProfileCard": { /* shareable card */ }
  }
}
```

### Record Synchronization

```bash
# Mark sync timestamp
node pendrive-cli.mjs sync

# View sync history
node pendrive-cli.mjs status
```

---

## 💾 Pendrive on USB Drive

### Move to USB

1. **Backup current pendrive:**
   ```bash
   xcopy "C:\Users\vinim\.yami\pendrive" "D:\yami-backup" /E /I
   ```

2. **Set environment variable:**
   ```powershell
   $env:YAMI_PENDRIVE_DIR = "D:\my-yami-pendrive"
   ```

3. **Or update `.yami.cmd` to point to USB:**
   ```batch
   set "YAMI_PENDRIVE_DIR=D:\my-yami-pendrive"
   ```

4. **Verify it works:**
   ```bash
   node pendrive-cli.mjs status
   ```

### Portability Features

✅ Works on any Windows machine
✅ Standalone operation
✅ No cloud required
✅ Full privacy - data stays local
✅ Can carry on USB stick
✅ Works on different drives

---

## 🔧 Advanced Usage

### Manual File Editing

All files are JSON and can be edited directly:

```bash
# Edit profile
code C:\Users\vinim\.yami\pendrive\profile.json

# Edit appearance
code C:\Users\vinim\.yami\pendrive\appearance.json

# Edit modules
code C:\Users\vinim\.yami\pendrive\modules.json
```

### Programmatic Access

```javascript
const pendrive = require('./runtime/pendrive-core.js');

// Get full status
const status = pendrive.getFullStatus();

// Get identity
const id = pendrive.getIdentity();

// Modify profile
const profile = pendrive.getProfile();
profile.displayName = "New Name";
pendrive.saveProfile(profile);

// Register evolution
pendrive.registerEvolution({
  type: "custom-event",
  description: "Something important happened",
  details: { custom: "data" }
});

// Add memory
pendrive.addMemoryEntry("note", "Important info", ["tag1", "tag2"]);

// Get all friends
const friends = pendrive.getSocialFriends();
```

---

## 📊 Status & Monitoring

### Full Status Report

```bash
node pendrive-cli.mjs status
```

Shows:
- Initialization status
- Unique Yami ID
- Instance name & generation
- Creation timestamp
- Current evolution stage
- Number of evolutions
- Friend count
- Message count
- Memory entries

### Via Web Dashboard

1. Menu → "Pendrive"
2. Click "Atualizar"
3. View status metrics:
   - ID YAMI
   - Identidade (Initialized/Not)
   - Estagio (current stage)

---

## 🤝 Friend Workflows

### Complete Friend Adding Workflow

```bash
# 1. Send invitation
node pendrive-cli.mjs friends invite "ymi-novo-amigo" "Olá! Gostaria de nos conectarmos?"

# 2. Friend accepts (they run this)
node pendrive-cli.mjs friends accept "seu-id-aqui"

# 3. Send first message
node pendrive-cli.mjs messages send "ymi-novo-amigo" "Que legal nos conhecermos!"

# 4. View message history
node pendrive-cli.mjs messages list "ymi-novo-amigo"
```

### Friend Sharing Workflow

```bash
# 1. Generate your profile card
node pendrive-cli.mjs card generate

# 2. Share the card (via copy-paste or QR)
node pendrive-cli.mjs card show

# 3. Friends import your card
node pendrive-cli.mjs friends add "seu-id-do-card" "seu-nome"
```

---

## 🔐 Privacy & Security

### What's Stored Locally

- ✅ Your unique identity (permanent)
- ✅ All customizations
- ✅ Evolution history
- ✅ Friends list & messages
- ✅ Personal memories
- ✅ Voice preferences

### What's NOT Sent Anywhere

- ❌ No cloud sync (optional in future)
- ❌ No analytics
- ❌ No telemetry
- ❌ No tracking
- ❌ 100% private & local

### Encryption Ready

The system includes `publicKey` field for future encryption:
- Friend messaging encryption
- Profile card signing
- Module verification

---

## 🐛 Troubleshooting

### Pendrive Not Initializing

```bash
# Check if directory exists
dir C:\Users\vinim\.yami\pendrive\

# Check if identity exists
node -e "const p = require('./runtime/pendrive-core.js'); console.log(p.getIdentity());"

# Force re-init
node -e "const p = require('./runtime/pendrive-core.js'); console.log(p.initPendrive());"
```

### Identity Not Found

```bash
# Check yami-id.json
type C:\Users\vinim\.yami\pendrive\yami-id.json

# If empty, run init
node pendrive-cli.mjs init
```

### Can't Find Memories

```bash
# Search with correct term
node pendrive-cli.mjs memory search "termo"

# List all
node pendrive-cli.mjs memory list

# Check file directly
type C:\Users\vinim\.yami\pendrive\memory\entries.json
```

---

## 📚 File Reference

| File | Purpose | Size |
|------|---------|------|
| `yami-id.json` | Unique identity (immutable) | ~300B |
| `profile.json` | User info & settings | ~400B |
| `appearance.json` | Tamagotchi customization | ~350B |
| `evolution.json` | Evolution history | Grows |
| `modules.json` | Module registry | ~500B |
| `voice.json` | Voice settings | ~250B |
| `sync.json` | Sync metadata | ~400B |
| `memory/entries.json` | Memory bank | Max 100KB |
| `social/friends.json` | Friends list | Grows |
| `social/messages.json` | Messages | Grows |
| `social/profile-card.json` | Shareable card | ~500B |
| `social/groups.json` | Groups framework | Grows |

---

## 🎯 Best Practices

### Daily Usage

1. **Regularly update profile** when preferences change
2. **Register important evolutions** to track progress
3. **Add memories** of important user preferences
4. **Connect with friends** for social features
5. **Sync periodically** to record activity

### Maintenance

1. **Backup periodically:**
   ```bash
   xcopy "C:\Users\vinim\.yami\pendrive" "C:\backups\yami-$(date +%Y%m%d)" /E
   ```

2. **Monitor pendrive size:**
   ```bash
   node pendrive-cli.mjs status
   ```

3. **Clean old memories** if approaching 10,000 limit

4. **Archive evolution history** if very large

### Portability

1. Keep pendrive on **USB stick** for true portability
2. Update environment variable on each computer
3. Set environment variable in Windows:
   ```powershell
   [Environment]::SetEnvironmentVariable("YAMI_PENDRIVE_DIR", "D:\my-yami", "User")
   ```

---

## 🚀 Future Enhancements

### Planned Features

- [ ] Cloud sync (optional)
- [ ] Encryption for friend messages
- [ ] Groups & communities
- [ ] Module marketplace sharing
- [ ] Automated backups
- [ ] Profile visibility controls
- [ ] Message read receipts
- [ ] Voice bio recordings
- [ ] Photo gallery in profile
- [ ] Achievement badges system

### Coming Soon

- [ ] Web portal for pendrive management
- [ ] Mobile companion app
- [ ] AI-powered memory suggestions
- [ ] Collaborative memory sharing
- [ ] Social feed from friends
- [ ] Evolution milestones rewards

---

## 📞 Support

For issues or questions:

1. Check `yami-id.json` exists and has valid ID
2. Run `status` command to see full system state
3. Check file permissions in `~/.yami/pendrive/`
4. Review logs in Web Dashboard → Pendrive page
5. Backup and re-init if corrupted:
   ```bash
   xcopy pendrive pendrive.backup /E
   node pendrive-cli.mjs init
   ```

---

## 📄 License & Attribution

The YAMI Pendrive Identity System is part of YAMI - your personal AI assistant.

Built with ❤️ for portability, privacy, and personalization.

**Your Yami, your identity, your control.**
