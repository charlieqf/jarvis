# JARVIS Docs

This folder contains the design and implementation documentation for JARVIS.

Start here:

- `00-overview.md` — Vision, goals, non-goals, principles
- `01-architecture.md` — High-level architecture and component responsibilities
- `10-mvp-checklist.md` — MVP feature checklist

Progress tracking:

- `progress/README.md` — How we track progress
- `progress/status.md` — Current status snapshot

Decisions:

- `18-decision-log.md` — Project decisions and rationale

Core design:

- `02-agent-routing.md` — Routing rules, session model, context hygiene
- `03-integrations-opencode.md` — OpenCode (coding agent) integration
- `17-opencode-instance-strategy.md` — One vs many OpenCode servers; isolation and scaling
- `04-integrations-nanobot.md` — nanobot (general agent) integration
- `05-tools-and-safety.md` — Tool categories, safety model, audit logs
- `06-voice-ux.md` — Voice pipeline, audio specs, PTT behavior
- `07-storage.md` — Storage separation, memory schema, secrets
- `23-openclaw-learnings-memory.md` — What we adopt from OpenClaw (esp. memory/persistence)
- `24-openclaw-learnings-adopted.md` — OpenClaw patterns we adopt (policy/doctor/logging/workspace)
- `13-desktop-app.md` — Desktop app internals (Tauri, IPC, sidecar lifecycle)
- `14-ui-design.md` — UI design system, mockups, color palette, animations
- `20-ui-review-and-recommendations.md` — Review of current mockups + refined Windows-first design direction

API and policy:

- `11-api-general-agent-service.md` — General Agent Service HTTP API contract
- `12-opencode-permission-policy.md` — OpenCode permission configuration template

Operations:

- `08-packaging.md` — Windows packaging and sidecar bundling
- `09-runbook.md` — Startup commands, env vars, debugging
- `15-implementation-roadmap.md` — Phased build plan, decisions, project structure
- `21-implementation-plan-contract-first.md` — Contract-first build plan (bottom layer -> interfaces -> parallel teams)
- `16-technical-review.md` — Technical feasibility review, risks, and applied fixes
- `25-demo-milestones.md` — Demo milestones from static/fake to dynamic/real

Testing:

- `22-testing-strategy.md` — Test pyramid + folder conventions (Rust/Python/TS)

Competitive landscape:

- `19-competitive-analysis-openclaw.md` — OpenClaw comparison and positioning

Reference implementations:

- `jarvis/code_reference/opencode` (OpenCode)
- `jarvis/code_reference/nanobot` (nanobot)
