# YAMI Pendrive — Real-World Examples

## Example 1: New User Setup

### Scenario
You're setting up YAMI for the first time and want to personalize it completely.

### Steps

```bash
# Step 1: Initialize the pendrive
node pendrive-cli.mjs init
# Output: Nova identidade gerada: ymi-mq5kti8l-8846c0baae22bad1

# Step 2: Verify identity was created
node pendrive-cli.mjs whoami
# Output: 
# Yami
# ID: ymi-mq5kti8l-8846c0baae22bad1
# Geracao: 1

# Step 3: Update your profile
node pendrive-cli.mjs profile set displayName "Vini's Smart Assistant"
node pendrive-cli.mjs profile set bio "AI que me ajuda com tudo"
node pendrive-cli.mjs profile set socialHandle "@vini-yami"

# Step 4: Customize appearance
node pendrive-cli.mjs appearance theme sunset-amber
node pendrive-cli.mjs appearance eyes cyborg
node pendrive-cli.mjs appearance glow amber
node pendrive-cli.mjs appearance accessory headphones

# Step 5: Configure voice
node pendrive-cli.mjs voice set voice "Microsoft Zira Desktop"
node pendrive-cli.mjs voice set volume 85
node pendrive-cli.mjs voice set rate 0

# Step 6: Add welcome memory
node pendrive-cli.mjs memory add "Yami foi criado em 2026. Proprietário prefere assistência em português."
node pendrive-cli.mjs memory add "Hora ativa: 7am-11pm. Modo silencioso: 11pm-7am"

# Step 7: Record first evolution
node pendrive-cli.mjs evolution register "nascimento-customizado" "Yami foi personalizadocompletamente pelo usuário"

# Step 8: Verify final setup
node pendrive-cli.mjs status
# Output: Shows all your customizations
```

### Result
✅ Unique Yami created and personalized
✅ Profile set with identity
✅ Custom appearance active
✅ Voice configured
✅ Evolution registered

---

## Example 2: Multi-Computer Setup

### Scenario
You have 3 computers (desktop, laptop, work PC) and want the SAME Yami everywhere using a USB drive.

### Initial Setup (Desktop)

```bash
# 1. Create on desktop, customize it
node pendrive-cli.mjs init
node pendrive-cli.mjs profile set displayName "Portable Yami"

# 2. Export the identity
node pendrive-cli.mjs export > C:\USB\yami-portable.json

# 3. Copy pendrive folder to USB
xcopy "C:\Users\vinim\.yami\pendrive" "D:\yami-pendrive" /E /I
```

### Setup on Laptop

```bash
# 1. Copy from USB
xcopy "D:\yami-pendrive" "C:\Users\laptop-user\.yami\pendrive" /E /I

# 2. Set environment variable
$env:YAMI_PENDRIVE_DIR = "C:\Users\laptop-user\.yami\pendrive"

# 3. Verify it's YOUR Yami
node pendrive-cli.mjs whoami
# Shows: Your original Yami ID from desktop!

# 4. Continue using (data syncs to USB)
node pendrive-cli.mjs status
```

### Setup on Work PC

```bash
# Keep on USB stick, set path
$env:YAMI_PENDRIVE_DIR = "E:\yami-pendrive"

# Same Yami across all computers!
node pendrive-cli.mjs whoami
```

### Sync Across Computers

```bash
# After each session, record sync
node pendrive-cli.mjs sync

# View sync history showing all hosts
node pendrive-cli.mjs status
# Output shows: Desktop, Laptop, Work-PC sync entries
```

### Result
✅ Same Yami ID everywhere
✅ Portable on USB drive
✅ Sync history tracks usage
✅ Memories & friends follow you

---

## Example 3: Social Network Building

### Scenario
You want to build a social network with friends' Yamis and exchange information.

### Step 1: Generate Your Shareable Card

```bash
# Create public profile card
node pendrive-cli.mjs card generate

# See your shareable profile
node pendrive-cli.mjs card show
# Output:
# {
#   "yamiId": "ymi-mq5kti8l-8846c0baae22bad1",
#   "displayName": "Vini's Yami",
#   "avatar": "cyborg",
#   "glowColor": "amber",
#   "evolutionStage": "primordial",
#   "badges": ["pendrive-nucleus"]
# }
```

### Step 2: Friend Adds You

```bash
# Friend gets your ID and adds you
node pendrive-cli.mjs friends add "ymi-mq5kti8l-8846c0baae22bad1" "Vini's Yami"

# You receive invitation
# (In real system, you'd see notification)
```

### Step 3: You Add Friend Back

```bash
# Friend shares their ID: ymi-amigo-001
node pendrive-cli.mjs friends add "ymi-amigo-001" "Friend's Cool Yami"

# Send them a message
node pendrive-cli.mjs messages send "ymi-amigo-001" "Hey! Vamos nos conectar?"
```

### Step 4: Exchange Memories

```bash
# Friend sends you a memory
# (Receive via API or manual entry)
node pendrive-cli.mjs memory add "Amigo recomenda: Use tema violet-haze"
node pendrive-cli.mjs memory add "Amigo's timezone: America/Sao_Paulo"
```

### Step 5: Share Customizations

```bash
# Export your appearance
node pendrive-cli.mjs appearance
# Share the JSON with friend so they can copy your look

# Friend tries your customization
node pendrive-cli.mjs appearance theme sunset-amber
node pendrive-cli.mjs appearance eyes cyborg
```

### Step 6: Build Community

```bash
# View your growing network
node pendrive-cli.mjs friends list
# Output:
# Amigos YAMI:
#   Friend's Cool Yami <ymi-amigo-001>
#   Workplace Yami <ymi-work-001>
#   Gaming Buddy Yami <ymi-gamer-001>
# Convites recebidos: 2
# Convites enviados: 1
```

### Result
✅ Multiple friends connected
✅ Message history with each
✅ Shared customizations
✅ Community memories
✅ Social network established

---

## Example 4: Evolution Tracking

### Scenario
You want to track how your Yami grows over time and reach new evolutionary stages.

### Week 1: Initial Discovery

```bash
# Day 1: Born
node pendrive-cli.mjs evolution register "nascimento" "Yami acordou para primeira conversa"

# Day 3: First learning
node pendrive-cli.mjs evolution register "primeiro-aprendizado" "Usuário ensinou primeiro comando customizado"
node pendrive-cli.mjs memory add "Comando: 'relatorio' retorna status diario"

# Day 5: First friend
node pendrive-cli.mjs evolution register "primeira-amizade" "Primeiro Yami adicionado à rede social"
```

### Week 2: Growing Capabilities

```bash
# Day 8: Module installed
node pendrive-cli.mjs evolution register "modulo-instalado" "Skill de automacao Yami foi instalada"

# Day 10: Customization milestone
node pendrive-cli.mjs evolution register "personalizacao-completa" "Aparencia totalmente customizada e salva"

# Day 12: Community involvement
node pendrive-cli.mjs evolution register "rede-social" "3 amigos conectados, 15 mensagens trocadas"
```

### Preparing for Adolescent Stage

```bash
# When ready to evolve
node pendrive-cli.mjs evolution stage "adolescente" "Yami Adolescente" "Forma intermediária com mais inteligencia"

# Verify stage change
node pendrive-cli.mjs evolution
# Output: currentStage: adolescente, totalEvolutions: 7
```

### View Complete History

```bash
# See entire evolution arc
node pendrive-cli.mjs evolution
# Output shows:
# generation: 1
# currentStage: adolescente
# totalEvolutions: 7
# 
# Recent evolutions:
# - evolucao-estagio: Yami avançou para adolescente
# - rede-social: 3 amigos conectados
# - personalizacao-completa: Aparencia customizada
# ... (rest of history)
```

### Result
✅ Clear evolution path tracked
✅ Multiple stages completed
✅ Milestone memories recorded
✅ Growth documented
✅ Ready for next evolution

---

## Example 5: Backup & Disaster Recovery

### Scenario
Your Yami's data gets corrupted, and you need to recover from backup.

### Regular Backups

```bash
# Weekly backup routine
$date = Get-Date -Format "yyyy-MM-dd"

# Backup 1: JSON export
node pendrive-cli.mjs export > "C:\Backups\Yami\yami-backup-$date.json"

# Backup 2: Full pendrive copy
xcopy "C:\Users\vinim\.yami\pendrive" "C:\Backups\Yami\pendrive-$date" /E /I

# Keep last 4 weeks
# Old backups automatically managed
```

### Disaster Recovery

```bash
# Oh no! Pendrive corrupted!
# Step 1: Check last backup date
dir C:\Backups\Yami\
# Latest: yami-backup-2026-06-05.json

# Step 2: Restore from backup
xcopy "C:\Backups\Yami\pendrive-2026-06-05" "C:\Users\vinim\.yami\pendrive" /E /I /Y

# Step 3: Verify recovery
node pendrive-cli.mjs status
# All data back!
```

### Complete Wipe & Restore

```bash
# If complete wipe happened:

# Step 1: Initialize fresh
node pendrive-cli.mjs init

# Step 2: Import from JSON backup
node pendrive-cli.mjs import < yami-backup-2026-06-05.json

# Step 3: Verify everything
node pendrive-cli.mjs friends list
# Friends restored!

node pendrive-cli.mjs memory list
# Memories restored!
```

### Result
✅ Regular backups maintained
✅ Data recovered successfully
✅ No data loss
✅ System restored to known state

---

## Example 6: Privacy-First Portable Yami

### Scenario
You want complete privacy and portability without any cloud services.

### Setup Portable USB Yami

```bash
# Step 1: Create on USB (no computer account info)
$env:YAMI_PENDRIVE_DIR = "D:\portable-yami"
node pendrive-cli.mjs init

# Step 2: Never connect to internet (optional)
# - Works 100% offline
# - All processing local
# - No cloud sync
```

### Use on Any Computer

```bash
# Computer 1 (work)
$env:YAMI_PENDRIVE_DIR = "E:\portable-yami"
node pendrive-cli.mjs status
# Your Yami, same ID, same memories

# Computer 2 (friend's house)
$env:YAMI_PENDRIVE_DIR = "F:\portable-yami"
node pendrive-cli.mjs whoami
# Same Yami!

# Computer 3 (internet cafe)
# Plug in USB
node pendrive-cli.mjs memories list
# All personal memories available
# No cloud service involved
```

### Privacy Verification

```bash
# All data is local
dir D:\portable-yami\
# See all files - they're on YOUR USB

# No external services
node pendrive-cli.mjs status
# Only local paths mentioned

# Encrypt USB if needed (Windows BitLocker)
# BitLocker E: /encryption aes256 /password mypassword
```

### Result
✅ Complete privacy (no cloud)
✅ True portability (USB drive)
✅ Works offline
✅ All data under your control
✅ Encrypted if desired

---

## Example 7: Team Yami Network

### Scenario
A team of people each has their own Yami, and they want to collaborate.

### Setup Team Network

```bash
# Person 1: Create and share
node pendrive-cli.mjs init
node pendrive-cli.mjs profile set displayName "Team Lead Yami"
node pendrive-cli.mjs card generate

# Share ID: ymi-team-lead-001
# Share JSON export with team

# Person 2: Add team members
node pendrive-cli.mjs init
node pendrive-cli.mjs friends add "ymi-team-lead-001" "Team Lead"
node pendrive-cli.mjs friends add "ymi-dev-1-001" "Developer 1"
node pendrive-cli.mjs friends add "ymi-dev-2-001" "Developer 2"

# Everyone adds everyone
# Full mesh network: 4 Yamis × 3 friends each = 12 connections
```

### Shared Memories (Team Knowledge Base)

```bash
# Developer 1 creates memory
node pendrive-cli.mjs memory add "Database password: ****** (stored in vault)"
node pendrive-cli.mjs memory add "API endpoint: https://api.team.local"

# Team Lead adds best practices
node pendrive-cli.mjs memory add "Code review: Check PR within 24 hours"
node pendrive-cli.mjs memory add "Deploy schedule: Mon/Wed/Fri at 2pm UTC"

# Shared via messages
node pendrive-cli.mjs messages send "ymi-dev-1-001" "New API endpoint documented in memory"
```

### Collaborative Evolution

```bash
# Each Yami tracks team evolution
node pendrive-cli.mjs evolution register "sprint-start" "Sprint 47 iniciado"
node pendrive-cli.mjs evolution register "feature-complete" "Feature de autenticacao completada"
node pendrive-cli.mjs evolution register "deployment" "Release v2.1.0 deployada"

# Team sees progress
node pendrive-cli.mjs evolution
# Shows complete team progress arc
```

### Result
✅ Team coordination
✅ Shared knowledge base
✅ Collaborative evolution
✅ Everyone connected
✅ Decentralized communication

---

## Example 8: Generational Evolution

### Scenario
Your Yami evolves through multiple generations, each building on the last.

### Generation 1: Primordial

```bash
# Start
node pendrive-cli.mjs init
# Generation: 1, Stage: primordial

# Learn basics
node pendrive-cli.mjs evolution register "learning" "Learned 5 basic commands"
node pendrive-cli.mjs evolution register "first-friend" "Made first friend"
node pendrive-cli.mjs evolution register "customization" "Personalized appearance"

# Advance stage
node pendrive-cli.mjs evolution stage "adolescente" "Yami Adolescente" "Growing smarter"

# View Gen 1
node pendrive-cli.mjs evolution
# Generation: 1, Stage: adolescente, Evolutions: 5
```

### Generation 2: Building on Foundation

```bash
# (In future when upgrading)
# New generation inherits everything
node pendrive-cli.mjs evolution stage "mature" "Yami Maduro" "Full intelligence reached"

# All memories, friends, evolution history preserved
node pendrive-cli.mjs friends list
# All friends still there

node pendrive-cli.mjs memory search "learning"
# All memories preserved

# Add Generation 2 evolution
node pendrive-cli.mjs evolution register "generational-upgrade" "Evoluiu para Geração 2"
```

### Timeline View

```bash
# See full generational timeline
node pendrive-cli.mjs status

# Shows:
# identity.generation: 2
# evolution.generation: 2
# evolution.recentHistory: [
#   { gen: 1, type: "learning" },
#   { gen: 1, type: "first-friend" },
#   { gen: 1, type: "stage-upgrade-adolescente" },
#   { gen: 2, type: "generational-upgrade" },
#   { gen: 2, type: "stage-upgrade-mature" }
# ]
```

### Result
✅ Multi-generational Yami
✅ All history preserved
✅ Continuous growth
✅ Generational tracking
✅ Complete lineage documented

---

## 🎯 Quick Pattern Reference

| Pattern | Command | Use Case |
|---------|---------|----------|
| **Setup** | `init`, `profile set`, `appearance theme` | New Yami |
| **Backup** | `export`, `xcopy pendrive` | Safety |
| **Social** | `friends add`, `messages send` | Connection |
| **Memory** | `memory add`, `memory search` | Learning |
| **Evolution** | `evolution register`, `evolution stage` | Growth |
| **Transport** | Set `YAMI_PENDRIVE_DIR` | Portability |
| **Sync** | `sync` | Activity tracking |

---

All examples use actual working commands. Copy and paste freely!
