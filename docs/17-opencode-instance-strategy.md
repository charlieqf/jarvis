# OpenCode Instance Strategy

Question: should JARVIS run multiple OpenCode *server processes* at once?

This doc distinguishes:

- **Server process**: `opencode serve` (one HTTP server on one port).
- **Project instance**: OpenCode internal per-directory context (created on demand inside one server).

## Recommendation (MVP)

Run **one** OpenCode server process per JARVIS desktop session.

Use per-request directory selection to support multiple repos.

## Why one server is enough

OpenCode is explicitly designed to multiplex multiple directories in one server:

- The server determines the active directory per request using:
  - `?directory=<path>` query param, or
  - `x-opencode-directory: <path>` header.
  - See: `jarvis/code_reference/opencode/packages/opencode/src/server/server.ts`.

- OpenCode caches project instances keyed by directory inside the server process.
  - See: `jarvis/code_reference/opencode/packages/opencode/src/project/instance.ts`.

Implications for JARVIS:

- One sidecar is sufficient for multiple repos.
- Switching repos is a header change, not a restart.
- Sessions stay separate; the server is shared.

## When multiple servers may be worth it

Multiple OpenCode server processes can make sense if you need:

- **Hard isolation**: different OS user contexts, stricter filesystem boundaries, or distinct trust zones.
- **Different global configs** that are hard to express per request (e.g., different storage roots, provider auth, or experimental flags).
- **Reduced blast radius**: a crash or deadlock affects only one repo.
- **Resource capping**: put one heavy repo per process to control CPU/memory.

Downsides:

- Port management and lifecycle complexity (spawn, health check, restart).
- More bookkeeping (repo -> server mapping).
- Higher baseline CPU/memory usage.

## Operational guidance

### Single-server approach (recommended)

JARVIS must:

- Attach the selected repo path to every OpenCode API request (`x-opencode-directory`).
- Maintain a mapping:
  - `jarvis_session_id -> opencode_session_id`
  - `opencode_session_id -> repo_path`

### Instance disposal

Even with one server, OpenCode can accumulate cached per-directory instances.

JARVIS can reclaim resources by disposing instances for repos that are idle:

- Call `POST /instance/dispose`.
- Important: disposal applies to the *current directory context*.
  - Set `x-opencode-directory` to the repo path before calling.

See: `jarvis/code_reference/opencode/packages/opencode/src/server/server.ts` (operationId `instance.dispose`).

## Decision summary

- MVP: **one** OpenCode server process.
- Use internal per-directory instances.
- Add idle cleanup via `/instance/dispose` if resource usage becomes noticeable.
