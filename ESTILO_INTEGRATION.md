# YAMI Writing Style System - Integration Guide

## Quick Start

The writing style system is now fully integrated into YAMI. Here's what was implemented:

### Files Created

```
~/.yami/estilo/
├── __init__.py              # Module initialization
├── __main__.py              # CLI entry point (python -m estilo)
├── profile.py               # Profile data model
├── analyzer.py              # Text analysis engine
├── prompt.py                # Prompt generation
├── cli.py                   # Command-line interface
└── README.md                # Full documentation

~/.yami/estilo_cli.ps1       # PowerShell wrapper (Windows)

~/.yami/pendrive/
└── estilo-escrita.json      # Profile data storage

~/.openclaw/workspace/
└── USER.md                  # Updated with writing style section
```

## How It Works

### 1. Continuous Learning
- YAMI observes your message patterns
- The analyzer extracts: vocabulary, formality, tone, expressions, etc.
- Profile is stored in `pendrive/estilo-escrita.json`
- Updates are incremental with recency bias

### 2. Style Reproduction
When you ask YAMI to write something in your style:
- YAMI reads the profile from the JSON file
- The AI uses it as context for generating authentic responses
- Works for: replies, emails, texts, automated responses

### 3. Manual Control
You have full control:
- View profile: `estilo status`
- Edit: `estilo edit {...}`
- Reset: `estilo reset`
- Disable: `estilo disable`

## Usage From Command Line

### Windows PowerShell
```powershell
# From any directory
cd C:\Users\vinim\.yami
.\estilo_cli.ps1 status
.\estilo_cli.ps1 view-section
.\estilo_cli.ps1 analyze "your text here"
.\estilo_cli.ps1 update "message to analyze"
.\estilo_cli.ps1 edit '{"formality": "casual"}'
.\estilo_cli.ps1 reset
```

### Python (Any Platform)
```bash
cd ~/.yami
python -m estilo status
python -m estilo view-section
python -m estilo analyze "your text"
python -m estilo update "text to analyze"
python -m estilo edit '{"key":"value"}'
python -m estilo reset
```

## Integration Points

### 1. Workspace Context (USER.md)
The profile is described in `~/.openclaw/workspace/USER.md`:
- The AI reads this file at startup
- Contains instructions on how to use the style profile
- Automatically injected into system prompt

### 2. Profile Data Storage
Located at `~/.yami/pendrive/estilo-escrita.json`:
- JSON format
- Persistent across sessions
- Contains: profile data + last 50 text samples
- Can be edited manually (JSON)

### 3. Python Module
The `estilo/` directory contains:
- Profile management
- Text analysis engine
- Prompt generation
- CLI interface

## For YAMI Interactions

### Teaching YAMI Your Style
```
Vini: "Analyze these messages I sent last week"
YAMI: [Analyzes messages]
      "Got it. Updated your style profile with [X] new messages."

Vini: "Show me what you learned"
YAMI: [Shows profile summary]

Vini: "Respond to that message in my style"
YAMI: [Uses profile to generate authentic response]
```

### Commands Through YAMI
You can ask YAMI directly:

```
"Show me my writing style profile"
→ YAMI runs: estilo status
  and reads the output

"Analyze this text: [text]"
→ YAMI runs: estilo analyze
  and explains findings

"Update my profile based on: [message]"
→ YAMI runs: estilo update
  and confirms

"Reset my writing style"
→ YAMI runs: estilo reset

"Disable the style system"
→ YAMI runs: estilo disable
```

## Profile Structure

### Stored Fields
```json
{
  "version": 1,
  "enabled": true,
  "lastUpdated": "ISO timestamp",
  "totalMessagesAnalyzed": 42,
  "profile": {
    "vocabulary": {
      "formal": 0.15,      // 0-1 score
      "technical": 0.25,   // 0-1 score
      "casual": 0.60       // 0-1 score
    },
    "formality": "casual",                    // detected category
    "slangUsage": "moderado",                 // frequency
    "sentenceStructure": "curto-direto",      // pattern
    "averageMessageLength": 95,               // characters
    "emojiFrequency": "frequente",            // rare/moderate/frequent
    "commonExpressions": ["então", "tipo"],   // top expressions
    "greeting": "oi",                         // typical greeting
    "closing": "valeu",                       // typical closing
    "primaryTone": "descontraído",            // main emotional tone
    "secondaryTone": "humorístico",           // secondary tone
    "styleTags": ["casual", "descontraído"],  // summary tags
    "description": "Human-readable summary"
  },
  "rawSamples": [...]                        // Last 50 analyzed texts
}
```

## Customization

### Manual Profile Edit
```bash
estilo edit '{"formality": "formal", "primaryTone": "profissional"}'
```

### Reset to Default
```bash
estilo reset
```

### Disable System
```bash
estilo disable
```

## Technical Details

### Analysis Metrics
The analyzer computes:
- **Vocabulary scores**: Matches against formal/technical/slang markers
- **Sentence length**: Average word count per sentence
- **Message length**: Average character count
- **Emoji patterns**: Frequency detection
- **Tone detection**: Based on markers and punctuation
- **Expression extraction**: Bigrams and common phrases
- **Formality classification**: Combined vocabulary analysis

### Incremental Updates
Profile updates use recency-weighted averaging:
```
new_value = old_value * (1 - weight) + new_analysis * weight
where weight = 1 / (total_analyzed + 1)
```

This gives more importance to recent messages while preserving patterns.

### Storage Efficiency
- Profile JSON: ~5KB typical
- Raw samples: ~50 recent texts stored
- Last 50 samples kept (circular buffer)

## Troubleshooting

### Profile Not Updating
```bash
# Check status
estilo status

# Manually update with a test message
estilo update "this is a test message"

# Check permissions on pendrive/
ls -la ~/.yami/pendrive/
```

### AI Not Using Style
1. Ensure USER.md was updated ✓
2. Verify profile is enabled: `estilo status`
3. Ask explicitly: "Write in my style"

### Lost Profile
```bash
# Backup your current profile
cp ~/.yami/pendrive/estilo-escrita.json ~/estilo-escrita-backup.json

# Reset and start fresh
estilo reset

# Restore if needed
cp ~/estilo-escrita-backup.json ~/.yami/pendrive/estilo-escrita.json
```

## Architecture Diagram

```
USER (Vini)
    ↓
YAMI (Assistant)
    ↓
[Write in my style?]
    ↓
AI Reads:
  - workspace/USER.md (contains writing style section)
  - pendrive/estilo-escrita.json (profile data)
    ↓
AI Generates Response Using Profile
    ↓
Natural, Authentic Communication
```

## Data Flow

```
User Message
    ↓
[Optional] Analyze with YAMI
    ↓
WritingAnalyzer.analyze()
    ↓
Extract features:
  - Vocabulary (formal/technical/casual)
  - Tone, formality, structure
  - Emoji patterns, expressions
  - Greetings/closings
    ↓
WritingAnalyzer.update_profile()
    ↓
Update with recency bias
    ↓
save_profile() → estilo-escrita.json
    ↓
PromptGenerator.build_style_section()
    ↓
Inject into USER.md / System Prompt
```

## Future Enhancements

Potential improvements:

1. **Context-aware adaptation**
   - Different styles for different contexts (professional vs casual)
   - Automatic context detection

2. **Change detection**
   - Alert when writing patterns change significantly
   - Track style evolution over time

3. **Comparison analysis**
   - Compare your style with others (optional)
   - Identify unique patterns

4. **Suggestions**
   - Suggest clarity improvements
   - Recommend expression alternatives

5. **Export/Import**
   - Export profile as report
   - Share profiles (anonymized)

## Security & Privacy

- Profile is stored locally in `~/.yami/pendrive/`
- Raw text samples kept only for recent messages (last 50)
- No external APIs or cloud sync
- Full control and transparency

---

**System Version**: 1.0.0  
**Last Updated**: 2026-06-08  
**Status**: Ready for use
