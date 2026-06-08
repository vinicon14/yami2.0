# Yami Upstreams

Yami is a separate local assistant runtime that currently derives selected
runtime pieces from two MIT-licensed projects:

- OpenClaw, MIT License, copyright OpenClaw Foundation.
- Hermes Agent, MIT License, copyright Nous Research.

The upstream licenses are preserved in:

- `runtime/core/LICENSE`
- `runtime/core/THIRD_PARTY_NOTICES.md`
- `hermes-adapted/LICENSE`

The goal is not to ship a visual copy. Yami should evolve its own runtime,
identity, UI, voice workflow, menu model and install packaging while reusing
compatible implementation ideas where useful.
