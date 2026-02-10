# Architecture

## High-level

JARVIS is a multi-process, agent-driven desktop system.

Primary processes:

1. JARVIS Desktop (Tauri v2 + Web UI)
2. General Agent Service (Python; nanobot-derived)
3. Code Agent Service (OpenCode; sidecar server)

The desktop app is the orchestrator. It owns the UX, safety gates, and the routing layer.

## Component diagram

```
 +--------------------------------------------------------------+
 |                       JARVIS Desktop App                     |
 |  - UI: chat, mode switch, status, logs                       |
 |  - Voice: PTT STT, TTS playback, interrupt                    |
 |  - Router: selects General vs Code                            |
 |  - Safety: permissions, confirmations, allowlists, audit log  |
 |  - OS Tools: app launch, window focus, whitelisted commands   |
 +----------------------------+-------------------+--------------+
                              |                   |
                              |                   |
               +--------------v----+    +--------v-------------+
               | General Agent Svc |    | Code Agent Svc        |
               | (nanobot-based)   |    | (OpenCode server)     |
               | - memory (SQLite) |    | - sessions/messages   |
               | - planning/tools  |    | - tool permissions    |
               +-------------------+    +-----------------------+
```

## Responsibilities

### Desktop App (source of truth)

- Maintains a single user-visible conversation stream, with explicit mode.
- Converts audio to text and text to audio.
- Provides a single "tool boundary" for OS-level actions.
- Presents permission prompts and collects approvals.
- Logs all tool calls and outcomes.

### General Agent Service (nanobot-based)

- Handles non-coding, cross-domain tasks (planning, summarization, memory).
- Maintains persistent memory (separate from code agent).
- Requests OS actions only through the Desktop tool boundary.

### Code Agent Service (OpenCode)

- Handles repository tasks (understanding, refactors, tests, debugging).
- Receives a project directory from Desktop per request.
- Uses OpenCode's own permission model for edits/bash/webfetch, surfaced via Desktop.

## Routing model

MVP uses explicit user-selected mode:

- General mode -> General Agent Service
- Code mode -> Code Agent Service

Future: intent classification as a soft suggestion that never overrides explicit mode.

## Streaming model

- Desktop UI consumes streaming updates.
- For OpenCode: subscribe to its server event stream and/or stream JSON response.
- For General agent: stream tokens from the provider (or chunked partial updates).

## Trust boundaries

- Agents do not directly execute unbounded OS actions.
- Desktop app enforces:
  - allowlists
  - confirmation prompts
  - workspace restrictions
  - audit logs
