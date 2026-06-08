# YAMI Pendrive — Quick Reference Card

## 🎯 Core Commands

```bash
# Initialize
node pendrive-cli.mjs init

# Status
node pendrive-cli.mjs status
node pendrive-cli.mjs whoami

# Profile
node pendrive-cli.mjs profile
node pendrive-cli.mjs profile set displayName "Name"

# Appearance
node pendrive-cli.mjs appearance theme violet-haze
node pendrive-cli.mjs appearance eyes happy
node pendrive-cli.mjs appearance glow pink
node pendrive-cli.mjs appearance accessory crown

# Evolution
node pendrive-cli.mjs evolution
node pendrive-cli.mjs evolution register "type" "description"
node pendrive-cli.mjs evolution stage "id" "name" "description"

# Friends
node pendrive-cli.mjs friends list
node pendrive-cli.mjs friends add "id" "name"
node pendrive-cli.mjs friends invite "id" "message"
node pendrive-cli.mjs friends accept "id"

# Messages
node pendrive-cli.mjs messages send "friend-id" "text"
node pendrive-cli.mjs messages list
node pendrive-cli.mjs messages list "friend-id"

# Memory
node pendrive-cli.mjs memory add "text"
node pendrive-cli.mjs memory search "term"
node pendrive-cli.mjs memory list

# Export
node pendrive-cli.mjs export
node pendrive-cli.mjs sync
```

## 🎨 Customization Options

### Themes
`dark-neon` | `cyber-blue` | `sunset-amber` | `violet-haze` | `forest-green` | `midnight-ocean`

### Eyes
`default` | `happy` | `sleepy` | `cyborg` | `starry` | `fire`

### Glow Colors
`cyan` | `amber` | `green` | `red` | `violet` | `pink` | `blue`

### Accessories
`crown` | `headphones` | `glasses` | `scarf` | `bow` | `none`

## 📂 File Structure

```
~/.yami/pendrive/
├── yami-id.json           # Identity (IMMUTABLE)
├── profile.json           # User info
├── appearance.json        # Customization
├── evolution.json         # History
├── modules.json           # Modules
├── voice.json             # Voice settings
├── sync.json              # Sync data
├── memory/
│   └── entries.json       # Memories (max 10K)
└── social/
    ├── friends.json       # Friends
    ├── messages.json      # Messages
    ├── profile-card.json  # Share card
    └── groups.json        # Groups
```

## 🌐 Web Dashboard

**Menu → Pendrive**
- Initialize pendrive
- Customize appearance
- Register evolution
- Add friends
- Send messages
- Manage memory
- Export identity

**Settings → Rede Social YAMI**
- Quick pendrive status
- Direct to pendrive page
- Export identity

## 🔗 REST API Endpoints

```
GET  /api/pendrive                 # Full status
POST /api/pendrive/init            # Initialize

GET  /api/pendrive/identity        # Identity
GET  /api/pendrive/profile         # Profile
POST /api/pendrive/profile         # Update profile

GET  /api/pendrive/appearance      # Appearance
POST /api/pendrive/appearance      # Customize

GET  /api/pendrive/evolution       # Evolution
POST /api/pendrive/evolution       # Register evolution

GET  /api/pendrive/voice           # Voice settings
POST /api/pendrive/voice           # Update voice

POST /api/pendrive/sync            # Record sync

GET  /api/pendrive/social/friends  # Friends
POST /api/pendrive/social/friends  # Manage friends

GET  /api/pendrive/social/card     # Profile card
POST /api/pendrive/social/card     # Generate card

GET  /api/pendrive/social/messages # Messages
POST /api/pendrive/social/messages # Send/receive

GET  /api/pendrive/memory          # Memory
POST /api/pendrive/memory          # Add memory

GET  /api/pendrive/export          # Export bundle
```

## ⚙️ Environment Variables

```bash
# Set custom pendrive location
$env:YAMI_PENDRIVE_DIR = "D:\my-yami-pendrive"

# Set via .cmd file
set "YAMI_PENDRIVE_DIR=D:\my-yami-pendrive"

# Persistent (Windows)
[Environment]::SetEnvironmentVariable("YAMI_PENDRIVE_DIR", "D:\yami", "User")
```

## 💡 Common Workflows

### Setup New Yami
```bash
node pendrive-cli.mjs init
node pendrive-cli.mjs profile set displayName "Meu Yami"
node pendrive-cli.mjs appearance theme violet-haze
```

### Add Friend
```bash
node pendrive-cli.mjs friends add "ymi-friend-id" "Friend Name"
node pendrive-cli.mjs messages send "ymi-friend-id" "Hello!"
```

### Track Progress
```bash
node pendrive-cli.mjs evolution register "milestone" "Achievement unlocked"
node pendrive-cli.mjs memory add "Important info"
```

### Backup & Move
```bash
xcopy C:\Users\vinim\.yami\pendrive D:\backups\yami-backup /E
# Set YAMI_PENDRIVE_DIR=D:\backups\yami-backup
```

## 🎯 Tips & Tricks

1. **Edit JSON directly** for bulk updates
2. **Export regularly** for backup
3. **Use tags in memories** for better search
4. **Build friend network** for social features
5. **Track evolution** to see Yami grow
6. **Customize appearance** for personal touch
7. **Move to USB** for true portability

## ✅ Checklist

- [ ] Initialize pendrive
- [ ] Set display name
- [ ] Customize appearance
- [ ] Add voice preferences
- [ ] Create first memory
- [ ] Add first friend
- [ ] Register evolution event
- [ ] Export backup
- [ ] Share profile card

## 🔑 Key Concepts

| Concept | Meaning |
|---------|---------|
| **Yami ID** | Permanent unique identifier |
| **Generation** | Version of Yami instance |
| **Stage** | Evolution level (primordial → transcendent) |
| **Pendrive** | Local identity nucleus |
| **Profile Card** | Shareable public profile |
| **Memory** | Local knowledge bank |
| **Sync** | Record activity & host info |

---

**Ready to personalize your Yami? Start with `init` command!**
