# OpenCode Integration

This doc describes how JARVIS integrates with OpenCode (the coding agent).

> **Source**: Lessons from real production integration in [opencode_service_integration_notes.md](file:///C:/work/code/crewAI/.worktrees/opencode-task-context/docs/opencode_service_integration_notes.md).

## Mental model

OpenCode in service mode is **not** a simple request → response API. It is:

- A **stateful session machine** — sessions are durable IDs tied to a working directory
- A **stream of message parts** appended over time (text, tool calls, patches, step markers)
- **Tool-heavy** — some turns write files for minutes without emitting any text

If you treat it like a blocking chat endpoint, you'll see:
- Long waits (minutes) with no UI updates
- False "done" signals while tools are still running
- Files written after your app already declared the turn complete

## Why OpenCode

OpenCode is designed as a client/server system. The server exposes an HTTP API (OpenAPI) and supports a type-safe JS SDK.

In the reference repo:

- `code_reference/opencode/packages/opencode/src/cli/cmd/serve.ts` — starts the headless server
- `code_reference/opencode/packages/opencode/src/server/server.ts` — HTTP API and auth
- `code_reference/opencode/packages/sdk/js/src/server.ts` — programmatic server launcher
- `code_reference/opencode/packages/desktop/src-tauri/src/server.rs` — Tauri sidecar pattern

## Process model

JARVIS Desktop runs OpenCode as a local sidecar:

- Launch command: `opencode serve --hostname=127.0.0.1 --port=<port>`
- Optional: set `OPENCODE_SERVER_PASSWORD` and use basic auth.

Desktop waits for readiness by polling:

- `GET /global/health`

## One server vs many

JARVIS should run a single OpenCode server process and multiplex repositories by setting `x-opencode-directory` per request.

Rationale and scaling/isolation tradeoffs: `jarvis/docs/17-opencode-instance-strategy.md`.

## Key endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/config` | GET | Get service config, verify available agents/models |
| `/global/health` | GET | Health check |
| `/session?directory=<workdir>` | POST | Create a session tied to a working directory |
| `/session/{sid}/message?directory=<workdir>` | POST | Send a prompt (sync, blocks until done) |
| `/session/{sid}/prompt_async?directory=<workdir>` | POST | Send a prompt (async, returns immediately) |
| `/session/{sid}/message?limit=N` | GET | Poll messages (for incremental updates) |
| `/session/status` | GET | Session status (**unreliable — see caveats**) |
| `/session/abort` | POST | Abort a busy session |
| `/event` | GET (SSE) | Real-time event stream |
| `/permission` | GET | List pending permission requests |
| `/permission/{requestID}/reply` | POST | Reply to a permission request |

## Selecting a project directory

OpenCode resolves its working directory per request via:

- query `?directory=<path>` or
- header `x-opencode-directory: <path>`

This enables one OpenCode server to handle multiple repos without restart.

## Message model (parts)

Messages are **not just text**. Each assistant message may include parts:

| Part type | Description |
|-----------|-------------|
| `text` | Natural language text |
| `tool` | Tool call invocation |
| `tool-result` | Result of a tool execution |
| `patch` | File modification (diff) |
| `step-start` | Marks the beginning of a multi-step action |
| `step-finish` | Marks completion of a multi-step action |

**Implications for JARVIS UI:**
- ChatView must render tool/patch parts, not just text
- A turn can be very active (tools/patches) without any `text` parts
- Short text fragments like `"Using skill: save-to-workdir"` are **intermediate**, not final answers

## Streaming & completion detection

### Preferred: SSE event stream

- `GET /event` (SSE) — subscribe for real-time updates across all sessions
- Use this for UI streaming in Code mode (unifies progress across tools and substeps)

### Fallback: polling

If SSE isn't viable, poll `/session/{sid}/message?limit=N`. But naive polling has sharp edges:

> [!WARNING]
> **`GET /session/status` is unreliable.** It can return `{}` even while the session is still generating tool/patch messages. Do not use it as the sole "done" signal.

### Completion heuristics (from production crewAI code)

When polling, apply these rules to determine if a turn is "done":

1. **Intermediate fragment rejection** — a response is likely incomplete if:
   - It starts with `"Using skill: ..."`
   - Text is shorter than ~50 characters
   - Text contains lead-in keywords ("I'll...", "Let me...", "Next...")
   - Text ends with `:` or `：`
   - Text lacks structure (no `\n`, `##`, `- `, or `1.` markers) and is < 120 chars

2. **Tool/patch activity = still running** — if new parts arrive with types `tool-invocation`, `tool-result`, or `patch`, the turn is active regardless of status endpoint

3. **Timeout hierarchy** (recommended production values):
   - `poll_interval`: 2s between polls
   - `response_stable_timeout`: 20s — if text hasn't changed in 20s AND looks complete, accept it
   - `tool_idle_grace`: 45s — keep polling if tool activity seen but session now idle
   - `incomplete_idle_grace`: 45s — keep polling if text looks incomplete
   - `max_wait`: 280-480s — absolute ceiling for the polling loop

4. **Auto-abort on return** — before returning a result, check if session is still busy. If so, call `POST /session/abort` to prevent blocking the next turn.

5. **Parent-ID turn isolation** — track the user message ID (`parentID`) to ensure responses belong to the current turn, not stale earlier turns.

### "No text, files updated" pattern

If OpenCode wrote files but produced no text:
```
"Do not run tools. Do not modify files. Just summarize what you created."
```
Use a shorter timeout (~90s) for this summary prompt. Include a `workdir_file_list` of current files so the assistant has context.

### File sync and verification

- **Retry window**: if assistant claimed file saves but initial sync found nothing, retry every 2s for 10-15s
- **Claim verification**: regex-match filenames in assistant text (e.g., `*.html`, `*.json`) and verify they exist on disk
- **Missing file handling**: warn user AND send a `prompt_async` back to OpenCode saying the file wasn't found

## Session management

### Session IDs

Session IDs look like `ses_...` and are long-lived. Treat them as:
- Stable handles to a working directory and accumulated context
- Required for conversation continuity in Code mode

### When to create a new session

- User explicitly starts a new code task / changes project directory
- Current session gets stuck busy and abort doesn't recover

### Session failure recovery (replay pattern)

On any exception during prompt dispatch:
1. Abort the current session
2. Create a new session with `POST /session?directory=<workdir>`
3. Replay condensed recent history (last ~50 messages) + current prompt
4. This is the only reliable way to recover from stuck/corrupted sessions

### When to abort

`POST /session/abort` is necessary for:
- Busy-session protection (prevent indefinite tool loops)
- Unblocking the next user turn
- Stopping token burn on runaway tasks

> [!NOTE]
> Abort can succeed (HTTP 200) but return non-JSON content. Build the client to be tolerant.

### Stuck session recovery

If a session is stuck busy and abort fails:
1. Create a new session
2. Optionally replay a condensed transcript (last N user/assistant messages + concise system summary)
3. Keep replay short to avoid context bloat

## Agent / model selection

OpenCode supports selecting an **agent name** per request (@`GET /config` shows available agents).

Rules:
- If using an agent name: send `{"agent": "<name>"}`, do NOT send a `model` override
- If not using agents: send explicit `model` override
- **`/config` is the only source of truth** for what agents/models are available — do not trust AGENTS.md or OMO config files

### OMO (oh-my-opencode)

OMO is a separate plugin that provides additional agents (Sisyphus, Oracle, Librarian, etc.). Running vanilla OpenCode does **not** enable OMO unless it's installed as a plugin. Verify via `GET /config`.

## Permissions and confirmations

OpenCode can request permissions; JARVIS surfaces them in the Desktop UI.

- List pending: `GET /permission`
- Reply: `POST /permission/{requestID}/reply` with `{ reply: "allow"|"deny"|"once"|... }`

See `code_reference/opencode/packages/opencode/src/server/routes/permission.ts`.

## Error handling

- Provider errors (e.g., "Insufficient balance") may appear as normal assistant text. Surface these clearly to the user.
- Some endpoints may return unexpected content-types (e.g., `text/html`) even on 200. Build the HTTP client to be tolerant.
- Avoid retry loops on provider billing errors (they burn more tokens).

## Security posture

- Keep OpenCode bound to loopback (`127.0.0.1`).
- If you ever bind to non-loopback, require `OPENCODE_SERVER_PASSWORD`.
- Set explicit OpenCode permissions config to match JARVIS safety policy (`12-opencode-permission-policy.md`).
- Treat OpenCode as a code-only domain: no access to the General Agent workspace (bootstrap + memory files).

## Integration checklist

- [ ] Use SSE or polling — never block on a single long request
- [ ] Render all message part types (text, tool, patch, step markers)
- [ ] Implement completion heuristics that reject intermediate fragments
- [ ] Add file sync retry window (10-15s after turn completes)
- [ ] Implement session abort for stuck/runaway tasks
- [ ] Handle non-JSON responses gracefully
- [ ] Verify agent availability via `GET /config` at startup
- [ ] Instrument: log timestamps for message send, first token, last activity, and final completion

## See also

- `12-opencode-permission-policy.md` — OpenCode permissions template
- `13-desktop-app.md` — Sidecar lifecycle management
- `05-tools-and-safety.md` — Tool classification and safety model
