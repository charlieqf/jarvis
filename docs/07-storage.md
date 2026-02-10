# Storage

## Separation

Maintain separate storage domains:

- General memory DB (SQLite): preferences, decisions, long-term notes
- Code context (filesystem): repo-specific session artifacts

Do not share a single memory store across general and code agents.

## General memory (SQLite)

Minimum schema (MVP):

- `memory_item(id, created_at, updated_at, kind, title, content, tags_json)`
- `memory_event(id, created_at, source, payload_json)` (optional audit/events)

Retrieval strategy (MVP):

- pinned items always included
- last N items included
- optional keyword search over title/content

## Code context

- OpenCode already persists sessions and diffs in its own storage model.
- JARVIS should only store:
  - which repo path was selected
  - mapping from jarvis_session_id -> opencode_session_id

## Secrets

- Do not store raw API keys in plain text files.
- Prefer OS keychain / Windows Credential Manager for secrets.
