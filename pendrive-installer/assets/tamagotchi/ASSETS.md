# YAMI Tamagotchi Visual Resources

This directory contains the visual assets for the YAMI Tamagotchi avatar.

## Files

| File | Description | Mood |
|------|-------------|------|
| yami-avatar-sheet.svg | Default avatar (gentle smile) | passive/idle |
| yami-avatar-speaking.svg | Speaking avatar (open mouth) | speaking |
| yami-avatar-sleeping.svg | Sleeping avatar (closed eyes, Zzz) | sleeping |
| yami.ico | Application icon for Windows | - |

## Usage

The Tamagotchi avatar is rendered by the YAMI Dashboard (auto-panel/public/index.html)
using pure CSS. These SVG files serve as static fallback images and documentation
references for the CSS-based avatar implementation.

## Customization

Users can customize the avatar appearance via:
- Dashboard > Settings > Appearance
- YAMI pendrive config/appearance.json

## Mood States (from CSS)

- passive: Default state, gentle glow, slow blink
- sleeping: Dimmed, closed eyes, Zzz indicator
- listening: Active listening, headphones indicator
- processing: Thinking, gear indicator, amber glow
- speaking: Active speaking, open mouth, green glow
- happy: Happy expression, increased blush
- curious: Questioning expression, violet glow
- error: Error state, red glow
- busy: Busy state, ellipsis indicator
- updating: Updating state, reload indicator
