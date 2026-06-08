# Yami

Yami is the local assistant runtime for this machine.

It is not a skin over OpenClaw. It is a Yami-owned runtime folder with its own
home, launcher, panel, voice state, gateway control, chats and configuration.

The first Yami core is derived from MIT-licensed OpenClaw runtime components and
will absorb selected MIT-licensed Hermes ideas for voice, memory, permissions
and agent ergonomics. Public UI and commands should use Yami naming.

## Paths

- `runtime/core`: embedded Yami runtime.
- `auto-panel`: Yami dashboard, avatar, voice and WhatsApp control.
- `bin/yami.cmd`: local Yami command.
- `yami.json`: Yami configuration.
- `runtime/yami-manifest.json`: Yami module registry and product identity.
- `runtime/compat`: legacy compatibility snapshots kept while the fork migrates.
- `hermes-adapted`: selected Hermes files used as reference/adaptation source.

## Rules

### Rule 1: Paridade Total entre Voz e Chat (Complete Voice-Chat Parity)

**Everything YAMI can do via text, it must be able to do via voice.**

- No chat-exclusive features
- No voice-exclusive features  
- Voice is a complete interface, not a secondary feature
- Background operations must not block voice input
- All new features must declare parity support before launch

**See**: [PARITY_RULE.md](./PARITY_RULE.md) and [PARITY_IMPLEMENTATION_GUIDE.md](./PARITY_IMPLEMENTATION_GUIDE.md)

### Rule 2: Product Identity

Yami can keep compatibility shims internally while the fork evolves, but the
product should not be a visual or UX copy. User-visible features should be owned
by Yami: Dashboard Yami, Gateway Yami, Chats Yami, Voz Yami and Automacoes Yami.
