# Storage

## Separation

Maintain separate storage domains:

- General memory (workspace Markdown): preferences, decisions, long-term notes
- Code context (filesystem): repo-specific session artifacts

Do not share a single memory store across general and code agents.

## General memory (workspace Markdown)

General memory is stored as user-readable Markdown inside the General Agent Service workspace (nanobot/OpenClaw-style):

- `workspace/memory/MEMORY.md` (curated long-term memory)
- `workspace/memory/YYYY-MM-DD.md` (daily append-only log)

Why:

- avoids overlapping memory systems with nanobot
- transparent and user-editable
- index/search can be added later without data migration

## Optional: memory index (cache)

For faster search and semantic recall, add an index later:

- Keyword index: SQLite FTS5 (cache)
- Semantic index: embeddings stored in SQLite (cache), optional sqlite-vec acceleration

The index is not the source of truth; it can be rebuilt at any time.

Related notes: `jarvis/docs/23-openclaw-learnings-memory.md`.

## Code context

- OpenCode already persists sessions and diffs in its own storage model.
- JARVIS should only store:
  - which repo path was selected
  - mapping from jarvis_session_id -> opencode_session_id

## Secrets

- Do not store raw API keys in plain text files.
- Prefer OS keychain / Windows Credential Manager for secrets.
