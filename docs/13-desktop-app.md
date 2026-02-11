# Desktop App (Tauri v2)

This document describes the internal architecture of the JARVIS Desktop application — the central orchestrator that owns UX, safety, and sidecar lifecycle.

## Process model

Tauri v2 provides a Rust backend (core process) and a WebView frontend (renderer).

```
 ┌───────────────────────────────────────────────┐
 │              Tauri Core (Rust)                 │
 │  - Sidecar management (spawn/kill/restart)     │
 │  - IPC command handlers                        │
 │  - Tool execution engine                       │
 │  - Permission gate                             │
 │  - Audit logger                                │
 │  - Audio capture (PTT mic access)              │
 │  - System tray                                 │
 └──────────────────────┬────────────────────────┘
                        │  Tauri IPC (invoke / events)
 ┌──────────────────────▼────────────────────────┐
 │            WebView Frontend (React+TS)         │
 │  - Chat view (streaming messages)              │
 │  - Mode switch (General / Code)                │
 │  - Status indicators                           │
 │  - Permission prompt dialogs                   │
 │  - Settings panel                              │
 │  - Voice controls (PTT button, TTS controls)   │
 └────────────────────────────────────────────────┘
```

## Rust backend responsibilities

### Sidecar lifecycle

The Rust backend owns the lifecycle of both sidecars:

1. **Spawn** — On app start (or on-demand), launch each sidecar process:
   - General Agent Service: `python -m uvicorn` (or bundled executable in production)
   - OpenCode: `opencode serve --hostname=127.0.0.1 --port=<port>`
     > **Dev phase**: Requires Bun or Node.js installed. Standalone binary bundling is deferred to packaging (Phase 4).
2. **Health polling** — After spawn, poll health endpoints until ready:
   - General Agent: `GET http://127.0.0.1:<port>/health`
   - OpenCode: `GET http://127.0.0.1:<port>/global/health`
3. **Crash recovery** — Monitor child processes. On unexpected exit:
   - Increment retry counter (bounded, e.g., max 3 retries within 60s)
   - Restart the sidecar
   - Emit a `sidecar_crashed` event to the frontend for a UI banner
4. **Shutdown** — On app exit, send graceful shutdown signals before force-killing.

### Port management

- Allocate free ports dynamically at startup using OS port 0 binding.
- Store assigned ports in app state; pass to sidecars via CLI args or env vars.
- Expose port info to frontend via IPC for direct SSE subscriptions.

### IPC command surface

Tauri commands (invokable from the frontend via `@tauri-apps/api`):

| Command | Purpose |
|---------|---------|
| `send_chat_message` | Route a user message to the active agent (General or Code) |
| `switch_mode` | Switch between General and Code mode |
| `get_sidecar_status` | Return health/status of each sidecar |
| `execute_tool` | Run an approved OS-level tool action |
| `reply_permission` | Respond to a pending permission request (allow/deny) |
| `abort_session` | Abort a busy/stuck OpenCode session (prevent token burn) |
| `get_opencode_config` | Fetch OpenCode `/config` to verify available agents/models |
| `start_voice_capture` | Begin PTT audio capture |
| `stop_voice_capture` | End PTT capture and trigger STT |
| `stop_tts_playback` | Interrupt current TTS playback |
| `get_audit_log` | Retrieve recent audit log entries |
| `write_memory` | Write a memory item via General Agent Service |
| `search_memory` | Search memory via General Agent Service |

### Tool execution engine

When an agent requests a tool action:

1. Receive `tool.request` event (via SSE or HTTP response).
2. Classify risk level (`safe` / `risky` / `forbidden`) using the local policy.
3. If `safe` → auto-execute. If `risky` → emit permission prompt to frontend. If `forbidden` → auto-deny.
4. Execute the action in a sandboxed context (scoped paths, timeout).
5. Log the action + result to the audit log.
6. Return the `ToolResult` to the requesting agent service.

### Audit logger

Append-only structured log (SQLite or JSONL file):

```
{
  "timestamp": "2026-02-10T00:00:00Z",
  "tool_name": "open_app",
  "parameters": { "app_id": "notion" },
  "agent": "general",
  "risk": "safe",
  "decision": "auto",
  "result": "ok",
  "error": null
}
```

## Frontend architecture

### Component structure

```
src/
├── App.tsx                  # Root layout, mode state, sidecar status
├── components/
│   ├── ChatView.tsx         # Message list, streaming display
│   ├── ChatInput.tsx        # Text input, send button, PTT button
│   ├── ModeSwitch.tsx       # General / Code toggle
│   ├── StatusBar.tsx        # Listening / Processing / Speaking / Idle
│   ├── PermissionDialog.tsx # Tool confirmation prompt
│   ├── AuditLogPanel.tsx    # Scrollable audit log viewer
│   ├── SettingsPanel.tsx    # LLM config, voice config, allowlists
│   └── SidecarBanner.tsx    # Crash/restart notification banner
├── hooks/
│   ├── useChat.ts           # Message state, streaming, tool lifecycle
│   ├── useVoice.ts          # PTT state, STT/TTS control
│   ├── useSidecar.ts        # Health polling, status events
│   └── useAuditLog.ts       # Audit log queries
├── lib/
│   ├── tauri.ts             # Typed IPC wrappers (invoke helpers)
│   ├── sse.ts               # SSE client for agent event streams
│   └── types.ts             # Shared TypeScript types
└── styles/
    └── index.css
```

### Streaming display

**General mode** (our agent service):
- Subscribe to SSE stream from `/v1/chat`.
- For `assistant.delta` events: append tokens to a streaming message bubble.
- For `tool.request` events: show a `PermissionDialog` overlay.
- For `assistant.final` events: finalize the message and optionally trigger TTS.

**Code mode** (OpenCode):
- Subscribe to OpenCode's `GET /event` SSE stream for real-time updates.
- Render **all message part types** — not just text:
  - `text` → standard message bubble
  - `tool` / `tool-result` → collapsible tool invocation cards
  - `patch` → inline diff view (file path + additions/deletions)
  - `step-start` / `step-finish` → progress indicators
  - Group tool work into "run cards" in the UI (collapsible command/patch/test blocks).
- **Completion detection**: do NOT rely solely on `/session/status` (it can return `{}` while still active). Instead:
  - Track tool/patch activity as "still running"
  - Reject short intermediate fragments (e.g., "Using skill: ...")
  - Use generous timeouts (5-10 min for tool-heavy turns)
  - If files exist but no text response, auto-send summary prompt
- See `03-integrations-opencode.md` for full completion heuristics.

### Mode switch behavior

- Mode state is owned by `App.tsx`.
- Switching mode does **not** clear the visible conversation.
- Each mode maintains its own session ID mapping (`general_session_id` / `code_session_id`).
- Active SSE subscriptions switch to the new agent's event stream.

### Voice UX (overlay-first)

- Default voice UI is a compact overlay/pill above the input bar (status + waveform + partial transcript).
- A full "Talk Mode" panel is optional and should not be required for PTT.

## Audio pipeline

Audio capture and playback are owned by the Rust backend (for low-latency native access), with controls exposed to the frontend via IPC.

```
PTT pressed → Rust: open mic stream → buffer PCM
PTT released → Rust: finalize buffer → send to STT backend
STT result → Rust: emit transcript event → Frontend: display + route as message
Agent response → Frontend: receive text → Rust: send to TTS engine → play audio
User interrupts → Frontend: invoke stop_tts_playback → Rust: halt playback immediately
```

> **Threading note**: `cpal` audio capture runs on a dedicated OS audio thread (not async). Use a bounded `tokio::sync::mpsc` channel to bridge PCM chunks from the audio thread to async Tauri command handlers. `stop_voice_capture` signals the stream to stop, drains the channel, then dispatches accumulated audio to the configured STT provider.

See `06-voice-ux.md` for audio format specs and UX details.

## Configuration

Desktop app configuration lives in the OS-appropriate config directory:

- Windows: `%APPDATA%/jarvis/config.json`

Key settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `general_agent_port` | auto | Port for General Agent Service |
| `opencode_port` | auto | Port for OpenCode server |
| `stt_backend` | `local` | `local` (whisper) or `remote` |
| `tts_backend` | `local` | `local` (Windows voices) or `remote` |
| `auto_start_sidecars` | `true` | Launch sidecars on app start |
| `max_sidecar_retries` | `3` | Max crash restarts within retry window |
| `audit_log_path` | `%APPDATA%/jarvis/audit.log` | Audit log file location |

## See also

- `01-architecture.md` — High-level system architecture
- `03-integrations-opencode.md` — OpenCode sidecar integration details
- `04-integrations-nanobot.md` — General Agent Service integration details
- `05-tools-and-safety.md` — Tool classification and safety model
- `06-voice-ux.md` — Voice UX pipeline and specifications
