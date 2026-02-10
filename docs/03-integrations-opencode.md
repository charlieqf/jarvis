# OpenCode Integration

This doc describes how JARVIS integrates with OpenCode (the coding agent).

## Why OpenCode

OpenCode is designed as a client/server system. The server exposes an HTTP API (OpenAPI) and supports a type-safe JS SDK.

In the reference repo:

- `jarvis/code_reference/opencode/packages/opencode/src/cli/cmd/serve.ts` starts the headless server.
- `jarvis/code_reference/opencode/packages/opencode/src/server/server.ts` implements the HTTP API and auth.
- `jarvis/code_reference/opencode/packages/sdk/js/src/server.ts` shows a programmatic server launcher.
- `jarvis/code_reference/opencode/packages/desktop/src-tauri/src/server.rs` shows a Tauri sidecar pattern.

## Process model

JARVIS Desktop runs OpenCode as a local sidecar:

- Launch command: `opencode serve --hostname=127.0.0.1 --port=<port>`
- Optional: set `OPENCODE_SERVER_PASSWORD` and use basic auth.

Desktop waits for readiness by polling:

- `GET /global/health`

## Selecting a project directory

OpenCode resolves its working directory per request via:

- query `?directory=<path>` or
- header `x-opencode-directory: <path>`

This enables one OpenCode server to handle multiple repos without restart.
See `jarvis/code_reference/opencode/packages/opencode/src/server/server.ts`.

## Messaging

Send a prompt to a session:

- `POST /session/:sessionID/message` (operationId: `session.prompt`)

Run a shell command within OpenCode's context:

- `POST /session/:sessionID/shell` (operationId: `session.shell`)

## Streaming

Two mechanisms matter:

1. Event stream:
   - `GET /event` (SSE)
   - Desktop subscribes and updates UI incrementally.
2. Prompt response:
   - The `session.prompt` handler uses a streaming response writer.

For MVP, prefer SSE for UI streaming because it unifies progress across tools and substeps.

## Permissions and confirmations

OpenCode can request permissions; JARVIS should surface them in UI.

- List pending permission requests:
  - `GET /permission`
- Reply to a permission request:
  - `POST /permission/:requestID/reply` with `{ reply: "allow"|"deny"|"once"|... }` (per OpenCode schema)

See `jarvis/code_reference/opencode/packages/opencode/src/server/routes/permission.ts`.

## Security posture

- Keep OpenCode bound to loopback (`127.0.0.1`).
- If you ever bind to non-loopback (e.g., `0.0.0.0`), require `OPENCODE_SERVER_PASSWORD`.
- Set explicit OpenCode permissions config to match JARVIS safety policy.
- Treat OpenCode as a code-only domain: no access to general memory DB.
