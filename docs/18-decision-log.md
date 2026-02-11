# Decision Log

This file records decisions we have made for JARVIS so implementation stays consistent.

Format:

- **ID**: stable identifier
- **Status**: accepted | superseded | pending
- **Decision**: what we chose
- **Why**: rationale and feasibility notes
- **Consequences**: what this implies for product/engineering

## D001 (accepted) — Multi-process architecture

- Decision: JARVIS runs as a desktop orchestrator plus two local sidecars:
  - General Agent Service (nanobot-derived)
  - Code Agent Service (OpenCode server)
- Why: matches the PRD's "separate intelligence domains" requirement and keeps safety/UX centralized.
- Consequences:
  - Desktop owns routing, permissions UI, voice pipeline, and audit logs.
  - Sidecars focus on reasoning + domain-specific tools.

## D002 (accepted) — Desktop is the safety authority

- Decision: all OS-level actions are executed through Desktop-owned tools with allowlists and confirmations.
- Why: neither nanobot nor OpenCode should have unbounded OS power; Desktop can present clear prompts and keep an append-only audit trail.
- Consequences:
  - General agent should not have raw shell in MVP (or must be strictly allowlisted).
  - Permission prompts must be first-class UI elements.

## D003 (accepted) — Separation of memory domains

- Decision: general memory is stored separately from code context; no shared memory store.
- Why: prevents leakage between personal/work context and repo-specific context; aligns with PRD separation.
- Consequences:
  - General Agent Service uses workspace Markdown memory files (nanobot/OpenClaw-style).
  - Any semantic/keyword memory search index is a rebuildable cache (SQLite/FTS/embeddings) and not the source of truth.
  - OpenCode sessions remain repo-scoped; JARVIS stores only session mappings.

## D004 (accepted) — OpenCode deployment: one server process (MVP)

- Decision: run a single `opencode serve` process and multiplex repos by setting `x-opencode-directory` per request.
- Why: OpenCode server is designed to select directory per request and cache per-directory instances internally.
  - Directory injection: `jarvis/code_reference/opencode/packages/opencode/src/server/server.ts`
  - Instance cache: `jarvis/code_reference/opencode/packages/opencode/src/project/instance.ts`
- Consequences:
  - JARVIS must attach `x-opencode-directory` to every OpenCode API call.
  - JARVIS should track `opencode_session_id -> repo_path`.
  - Optional cleanup: call OpenCode `/instance/dispose` for idle repos.

## D005 (accepted) — Chat UX: single main window, multi-conversation

- Decision: JARVIS can be a single chat window, with a conversation list ("New chat"). Multiple OS windows are optional.
- Why: sessions/threads are needed for backend correctness, but they do not require multiple windows.
- Consequences:
  - Each conversation maintains separate backend sessions:
    - `general_session_id` (general service)
    - `code_session_id` + `repo_path` (OpenCode)
  - The user-facing transcript can be unified, but messages must be routed to the correct backend session.

## D006 (accepted) — Mode switch drives routing (MVP)

- Decision: routing is controlled by an explicit user mode toggle: `general` vs `code`.
- Why: avoids accidental context leakage and reduces ambiguity; intent classification can be added later as a suggestion.
- Consequences:
  - In code mode, prompts go to OpenCode; in general mode, prompts go to the general service.
  - Switching mode does not merge memory.

## D007 (accepted) — Permission handling is interactive

- Decision: permission requests are surfaced as prompts in the Desktop UI; approvals are explicit.
- Why: both safety and user trust depend on transparency; OpenCode already has a permission request API.
- Consequences:
  - Desktop needs a permission panel/state machine.
  - For OpenCode, use:
    - list pending: `GET /permission`
    - reply: `POST /permission/:requestID/reply`

## D008 (accepted) — Streaming is a core requirement

- Decision: all agent responses should stream (tokens and/or events).
- Why: improves perceived latency, enables mid-run cancellation, and supports voice (interruptible TTS).
- Consequences:
  - General Agent Service uses SSE for `POST /v1/chat` when `stream=true`.
  - OpenCode uses its event stream (`GET /event`) and/or streaming prompt responses.

## D009 (accepted) — Voice pipeline lives in Desktop

- Decision: STT/TTS (push-to-talk, interrupt) is implemented in the Desktop app layer.
- Why: voice UX is UI/runtime-sensitive and should not depend on agent internals.
- Consequences:
- Agents receive text transcripts; TTS consumes streamed text output.

## D010 (accepted) — Positioning vs OpenClaw

- Decision: JARVIS focuses on **Windows-native local productivity + coding** and does not try to replicate OpenClaw's multi-channel gateway/product.
- Why:
  - OpenClaw is gateway/channel-first and recommends Windows via WSL2; it is not optimized for a native Windows tray/overlay/OS-actions experience.
  - Rebuilding a gateway + multi-channel ecosystem would be redundant and high risk.
  - JARVIS can win by being narrow and excellent: low-friction Windows desktop UX + a best-in-class coding mode.
- Consequences:
  - MVP scope stays desktop-first (one window, PTT voice, local tool boundary).
  - Messaging-channel integrations are optional and out of MVP.
  - OpenClaw integration remains a future option, not a requirement.
  - Analysis doc: `jarvis/docs/19-competitive-analysis-openclaw.md`.

## D011 (accepted) — Wrap "nanobot + OpenCode" under Desktop

- Decision: implement JARVIS as a Windows desktop orchestrator over two specialized backends:
  - nanobot (general assistant runtime; simplified OpenClaw-like loop)
  - OpenCode (coding agent server)
- Why:
  - nanobot provides a minimal general agent loop and tool registry that is easy to constrain.
  - OpenCode provides a dedicated code-agent with repo-aware tooling and a permission request API.
  - Desktop can unify streaming UX, voice, permissions, and audit logs.
- Consequences:
  - Treat both backends as swappable services behind stable Desktop contracts.
- Keep domain separation: no shared memory store; explicit routing by mode.

## D012 (accepted) — UI direction: Windows-native instrument panel

- Decision: adopt a Windows-native, Fluent-adjacent "instrument panel" design with restrained glass and meaningful highlights.
- Why:
  - JARVIS is desktop-first; it should look native and trustworthy.
  - Heavy glow/blur reads as generic sci-fi and can be fragile in Windows WebView performance.
  - Glow should encode state (listening/approval/error), not decoration.
- Consequences:
  - Default UI font is `Segoe UI Variable`.
  - Voice UI is overlay-first (pill above input), not a full-screen mic mode.
  - Code mode emphasizes run cards and diffs in the transcript.
  - Doc: `jarvis/docs/14-ui-design.md` (updated), `jarvis/docs/20-ui-review-and-recommendations.md`.

## D013 (accepted) — Memory source of truth: workspace Markdown

- Decision: the General Agent Service uses nanobot/OpenClaw-style **workspace Markdown** as the memory source of truth:
  - `workspace/memory/MEMORY.md` (curated long-term memory)
  - `workspace/memory/YYYY-MM-DD.md` (daily append-only log)
  - Bootstrap files are allowed (AGENTS/USER/TOOLS/etc).
- Why:
  - Avoids overlapping memory systems (no "SQLite memory" competing with nanobot files).
  - Memory is transparent and user-editable, increasing trust.
  - Search can be implemented as a rebuildable index later (SQLite/FTS/embeddings).
- Consequences:
  - Update the General Agent Service API so memory operations read/write workspace files.
  - If we later add an index, treat it as cache and rebuild it on config changes.
  - Reference: `jarvis/docs/23-openclaw-learnings-memory.md`.

## D014 (pending) — Pre-compaction memory flush

- Decision: decide whether to implement an automatic "memory flush" step before compaction/summarization in the general agent.
- Why: reduces loss of durable decisions/preferences when context is compacted.
- Consequences:
  - Requires a compaction budget/threshold mechanism and a silent write-to-memory turn.
  - Reference: `jarvis/docs/23-openclaw-learnings-memory.md`.

## D015 (accepted) — Mental model: Desktop orchestrator + two brains

- Decision: JARVIS is not "nanobot with a UI". It is a Windows desktop orchestrator/product that integrates:
  - nanobot-derived General Agent Service (general reasoning + workspace memory)
  - OpenCode sidecar (coding subsystem)
- Why:
  - Desktop must own voice, permissions, tool boundary, audit logs, and unified streaming UX.
  - nanobot remains focused on general reasoning; OpenCode remains focused on repo work.
- Consequences:
  - UI shows a unified transcript, but routing and session state remain separate per domain.
  - Desktop is the only component allowed to execute OS tools.

## D016 (accepted) — Demo strategy: staged realism

- Decision: run demo milestones in a static/fake -> dynamic/real sequence instead of waiting for full backend completion.
- Why:
  - We need early user feedback on UX trust/clarity before expensive backend work is complete.
  - Contract-first development makes realistic fake demos cheap and reliable.
- Consequences:
  - Milestones M0..M6 are now part of delivery expectations (`jarvis/docs/25-demo-milestones.md`).
  - Progress tracking should reference milestone completion, not just engineering tasks.
