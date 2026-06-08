# Changelog

Docs: https://docs.openclaw.ai

## 2026.6.2

### Highlights

- Plugin and skill installs now use an operator install policy instead of the old dangerous-code scanner path, with clearer doctor, CLI, ClawHub, and troubleshooting surfaces for package, archive, source, upload, and marketplace installs. (#89516) Thanks @joshavant.
- Telegram, Feishu, Discord, WhatsApp, and outbound delivery paths got safer around duplicate transcript mirrors, Telegram admin writeback, streamed-final previews, approval allowlists, setup runtime state, poll modifiers, Discord voice errors, and internal progress traces. (#88973, #89626, #89812, #89035, #89814, #89813, #89601) Thanks @pgondhi987, @Petru2224, @zhangguiping-xydt, @codezz, and @takhoffman.
- Chat, Control UI, Skill Workshop, Workboard, Android companion shell, and WebChat flows now preserve visible streaming text, reconcile completed sends, expose ACK timing, add Workboard keyboard movement, harden dialog accessibility, lazy-load usage views, keep current chat toggles working, and improve Android companion-first shell navigation. (#89801, #89777, #89802) Thanks @vincentkoc.
- Security, policy, and config recovery now reject corrupt shell snapshots, unsupported policy keys, unsafe exec approval precheck environments, malformed script limits, and suspicious gateway startup configs while adding data-handling conformance checks. (#89701, #87074, #81488, #87056, #89480) Thanks @RomneyDa, @giodl73-repo, and @mmaps.
- Gateway, agent, Codex, provider, model, and memory paths now recover session write-lock release failures, abandoned Codex app-server startups, stream-to-parent ACP spawns, custom-provider runtime fanout, bundled provider aliases, prompt-cache boundaries, Gemini stop sequences, Kimi cache markers, and watcher pressure warnings. (#89811, #89244) Thanks @RomneyDa and @takhoffman.
- Release, CI, Docker, Crabbox/Testbox, package, and E2E validation lanes now bound more network calls, malformed numeric limits, process groups, cleanup leaks, package hydration paths, Windows installer publishing, release asset verification, and log drains so failures produce bounded proof instead of hanging.

### Changes

- Plugins/security: replace dangerous-code scanner enforcement with operator install policy, install-policy context, doctor checks, install/update CLI wiring, ClawHub metadata paths, and package/archive/source/upload lifecycle coverage. (#89516) Thanks @joshavant.
- Policy: add data-handling conformance checks and reject unsupported policy keys. (#87056, #87074) Thanks @giodl73-repo.
- Telegram/channels: show commentary and reasoning in progress drafts, share progress draft compositors across channel plugins, and keep Telegram polling stop/reset boundaries cheaper and more reliable.
- UI/mobile: add Workboard keyboard movement controls, tighten Workboard card operations, improve Android companion-first shell UX, and document chat ACK timing metadata. (#89802) Thanks @vincentkoc.
- Release metadata: align the root package, publishable plugin manifests, generated shrinkwraps, appcast, iOS, Android, macOS, Matrix plugin changelog, and docs/generated baselines with the 2026.6.2 beta train.
- Release/packaging: promote Windows node installer publishing, require verified Windows release asset links, and document GitHub release-note edits.
- Docs: refresh Windows Hub setup guidance and document Gateway, CLI, and plugin SDK helper contracts.

### Fixes

- Channels/outbound: keep channel sends durable when transcript mirroring fails, stop schema-padded poll modifiers from blocking normal sends, preserve WebChat `sessions_send` handoffs, preserve Discord channel-label suppression while hiding internal agent failure traces, match Discord libopus error shapes, and sanitize Discord tool progress scaffolding. (#89626, #89812, #89601) Thanks @Petru2224, @codezz, and @takhoffman.
- Telegram/Feishu: require admin rights for Telegram target writeback, keep Telegram DM exec approval allowlists working with `ask:off`, prevent Telegram preview duplication across streaming modes, isolate verbose status after streamed finals, cancel clean restart stop timers, slow polling restart storms, and wire Feishu setup runtime setters. (#88973, #89035, #89813, #89814) Thanks @pgondhi987, @zhangguiping-xydt, and @takhoffman.
- Chat/UI/Gateway: preserve visible chat stream text, clear stale stream buffers before terminal commits, reconcile completed sends, scroll pending sends into view, harden Workboard dialog accessibility, stabilize WebChat prompt-cache affinity, overlap chat catalog startup, render chat history incrementally, lazy-load usage dashboard, and report gateway health auth diagnostics. (#89337) Thanks @RomneyDa.
- Agents/Codex/providers/models: release session write locks when prompt-release fence reads fail, retire abandoned Codex app-server startups, keep stream-to-parent ACP spawns registered, close Codex startup clients on timeout, recover bundled provider aliases, avoid custom-provider runtime fanout, preserve provider prompt-cache boundaries, forward Gemini stop sequences, and strip Kimi-incompatible Anthropic cache markers. (#89811) Thanks @takhoffman.
- Memory/build/update: warn after startup watcher pressure checks, externalize optional Baileys image backends, restore and pin Canvas A2UI compatibility assets, keep plugin repair fetch failures nonblocking, restore Skill Workshop view switching, and keep the current chat toggle active after awaited session switches. (#89244) Thanks @RomneyDa.
- Security/config/tooling: reject corrupt shell snapshots, suspicious gateway startup configs, malformed release/test/tooling/Docker/perf numeric limits, oversized audit responses, unsafe exec precheck env, and invalid pending-agent SQLite scaffold denials. (#89701, #89705, #89480, #81488) Thanks @RomneyDa and @mmaps.
- Release/CI/E2E: restore package changelog extraction after the post-2026.6.1 version bump, keep hydrated pnpm modules under `node_modules` for ARM/Linux package lifecycle scripts, keep OpenAI live-cache prerequisites advisory while Anthropic prerequisites stay blocking, retry Windows Parallels background log appends on transient file-lock errors, bound candidate GitHub and cross-OS Discord fetches, harden ARM smoke/browser checks, show Docker build heartbeats, reset Crabbox pnpm hydrate state, and isolate Testbox/Docker/release journey artifacts.
