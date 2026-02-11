# Implementation Plan (Contract-First)

This plan matches the preferred execution style:

1) build a minimal testable bottom layer
2) define strong interfaces
3) then backend and frontend can work simultaneously

It is written to reduce integration risk and allow independent progress.

## Guiding rules

- Desktop app is the orchestrator and safety authority.
- All cross-process communication uses explicit contracts (schemas + examples).
- Prefer stubs/mocks early so the UI can be built without waiting for real AI.
- Every milestone must be demoable and testable locally.

Demo plan reference:

- `jarvis/docs/25-demo-milestones.md` defines static/fake -> dynamic/real checkpoints.

## Phase 0: Contracts (freeze interfaces)

Deliverables:

- A `jarvis/contracts/` package (schemas + examples) that is the single source of truth.
- A small contract test runner that validates payloads against schemas.

Contracts to define:

1. **Desktop <-> UI (Tauri IPC + events)**
   - Commands: send message, switch mode, reply permission, get status, stop TTS
   - Events: stream deltas, run cards, permission requested, audit appended, sidecar crashed

2. **Desktop <-> General Agent Service (HTTP + SSE)**
   - Use `jarvis/docs/11-api-general-agent-service.md` as baseline.
   - Lock the SSE event types and payload schema.

3. **Desktop <-> OpenCode (HTTP + SSE + permission loop)**
   - Define a thin "OpenCodeAdapter" interface that the Rust backend implements.
   - Hide OpenCode quirks behind stable events for the UI (run cards).

4. **Tool boundary (Desktop-owned tools)**
   - Tool request shape (agent -> desktop)
   - Tool approval shape (desktop -> UI)
   - Tool result shape (desktop -> agent)

Artifacts inside `jarvis/contracts/`:

- `schemas/*.schema.json` (JSON Schema)
- `examples/*.json` (golden payloads)
- `types.ts` (shared TS types for frontend)
- `README.md` (how to validate contracts)

Acceptance criteria:

- Frontend can be developed using only contract mocks.
- Backend can validate all emitted payloads against schemas.

## Phase 1: Minimal testable bottom layer (desktop supervisor + stubs)

Goal: prove that JARVIS can supervise processes, stream events, gate tools, and log actions.
No real LLM calls required.

Implement in Desktop (Tauri Rust):

- Sidecar lifecycle: spawn, health polling, crash recovery.
- Event bus: normalize streams into UI events (contract-driven).
- Permission gate: accept tool requests, classify risk, ask/allow/deny, return results.
- Audit log: append-only logging for requests/decisions/results.

Create two stub sidecars (local-only):

- **General agent stub**
  - Implements `GET /health` and `POST /v1/chat` (SSE)
  - Emits `assistant.delta` and occasional `tool.request`

- **OpenCode stub**
  - Implements `GET /global/health`, `GET /event` (SSE)
  - Emits OpenCode-like events mapped to run cards
  - Implements permission endpoints (`/permission`, `/permission/:id/reply`) for UI testing

Acceptance criteria:

- UI shows streaming text for both modes.
- Permission approval flow works end-to-end (deny/allow -> tool result -> audit entry).
- Sidecar crash -> desktop auto-restart -> UI banner.

Demo gate:

- Equivalent to milestone **M2** in `25-demo-milestones.md`.

## Phase 2: Parallelization (backend team + frontend team)

With contracts frozen and stubs working, split work.

### Backend team scope

- Replace General agent stub with real nanobot-derived service:
  - streaming loop (LiteLLM stream)
  - proxy tool pattern (desktop executes tools)
  - workspace Markdown memory (nanobot/OpenClaw-style)
  - optional rebuildable search index later (cache)

- Replace OpenCode stub with real OpenCode integration:
  - `opencode serve` spawning + health check
  - `x-opencode-directory` per request
  - `/event` subscription
  - `/permission` list + reply surfaced in UI
  - completion heuristics and abort semantics per `03-integrations-opencode.md`

- Implement real desktop tools (strict allowlists):
  - `open_app(app_id)`
  - `run_whitelisted(cmd_id)`

### Frontend team scope

- Implement Windows-native "instrument panel" UI per:
  - `jarvis/docs/14-ui-design.md`
  - `jarvis/docs/20-ui-review-and-recommendations.md`

- Build around contract-driven events:
  - conversation list
  - transcript with run cards (command/patch/test)
  - approval sheet
  - status dots + banners
  - audit log view (initially read-only)
  - voice overlay UI (even if backend is stubbed)

Acceptance criteria:

- Frontend runs entirely against stubs.
- Backend passes contract tests and can be swapped in without UI changes.

Demo gates:

- **M3** when General mode is real.
- **M4** when OpenCode mode is real.

## Phase 3: Voice (overlay-first)

Goal: PTT capture + STT + interruptible TTS.

- Implement audio capture/playback in Rust.
- UI uses overlay/pill above input bar.
- Keep providers swappable via settings.

Acceptance criteria:

- Hold-to-talk inserts transcript into input.
- TTS can be interrupted instantly.

Demo gate:

- **M5** in `25-demo-milestones.md`.

## Phase 4: Packaging + reliability

- Bundle sidecars, manage upgrades.
- Harden permissions and defaults.
- Improve diagnostics and logs.

## Verification checklist (for every phase)

- Contracts validated (schemas + examples).
- One-click local demo path (runbook).
- No unsafe default tools (no raw shell in general mode).

## See also

- `jarvis/docs/15-implementation-roadmap.md`
- `jarvis/docs/13-desktop-app.md`
- `jarvis/docs/11-api-general-agent-service.md`
- `jarvis/docs/03-integrations-opencode.md`
