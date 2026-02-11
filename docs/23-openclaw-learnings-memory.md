# OpenClaw Learnings (Memory + Persistence)

This document summarizes OpenClaw's long-term memory / persistent storage mechanisms and identifies patterns we can adopt in JARVIS to save time.

Primary sources:

- OpenClaw memory docs: https://docs.openclaw.ai/concepts/memory
- OpenClaw agent workspace docs: https://docs.openclaw.ai/concepts/agent-workspace
- OpenClaw logging docs: https://docs.openclaw.ai/gateway/logging
- OpenClaw memory CLI docs: https://docs.openclaw.ai/cli/memory

## What OpenClaw does (high signal)

### 1) Memory source of truth is user-readable Markdown

OpenClaw treats memory as files in the agent workspace:

- `memory/YYYY-MM-DD.md` (daily append-only log)
- `MEMORY.md` (curated long-term memory; only injected in main/private contexts)

Key benefit: memory is transparent and editable by the user.

### 2) Bootstrapped workspace files are injected into context

OpenClaw seeds a workspace with instruction/persona/user profile files (e.g. `AGENTS.md`, `SOUL.md`, `USER.md`, `TOOLS.md`) and injects them at session start.

Key benefit: durable instructions and preferences live outside the model.

### 3) Memory search is an index, not the source of truth

OpenClaw's `memory_search` is backed by a plugin (default `memory-core`) that builds an index over the Markdown files.

Implementation highlights:

- Index is stored per-agent in SQLite (`~/.openclaw/memory/<agentId>.sqlite`).
- Supports semantic search via embeddings.
- Supports hybrid retrieval (BM25/FTS + vectors) when available.
- Watches memory files for changes and reindexes asynchronously (debounced).
- Stores a fingerprint of provider/model/chunking params and triggers a full reindex when those change.

Key benefit: you get powerful retrieval without locking memory inside a database schema.

### 4) Automatic pre-compaction "memory flush"

Before compaction, OpenClaw triggers a silent turn to encourage writing durable memory to disk.
This reduces "lost decisions" during summarization/compaction.

Key benefit: memory capture becomes a system behavior, not a user habit.

### 5) Session transcripts are persisted separately

OpenClaw stores session transcripts on disk as JSONL, separate from memory.
It can optionally index sessions for recall (opt-in).

Key benefit: you can keep conversation continuity and diagnostics without polluting long-term memory.

## What we should adopt for JARVIS

JARVIS is Windows-native and single-user. We can adopt OpenClaw's persistence patterns without adopting its gateway/channel platform.

Recommended adoption list:

1) **Transparent memory format**
- Keep a user-readable memory surface (Markdown) as the source of truth.
- Split memory into:
  - daily log (append-only)
  - curated memory (durable preferences/decisions)

2) **Workspace concept for persona + preferences**
- Maintain a JARVIS-owned workspace directory under app data that contains:
  - `AGENTS.md` (operating instructions)
  - `USER.md` (user profile)
  - `TOOLS.md` (tool conventions)
  - `MEMORY.md` + `memory/YYYY-MM-DD.md`

3) **Index is a cache**
- Treat semantic search as an index you can rebuild.
- Keep the index versioned by embedding provider/model + chunking params.

4) **Memory flush hook**
- Add a "pre-compaction memory flush" step in the general agent service.

5) **Separate transcript logs**
- Store transcripts as JSONL (or SQLite) separate from memory.
- Optionally index transcripts later for recall.

## Concrete JARVIS mapping

### Storage locations (Windows-friendly)

Suggested locations (conceptual; final paths live in `%APPDATA%` / `%LOCALAPPDATA%`):

- Workspace (user-editable):
  - `.../jarvis/workspace/AGENTS.md`
  - `.../jarvis/workspace/USER.md`
  - `.../jarvis/workspace/TOOLS.md`
  - `.../jarvis/workspace/MEMORY.md`
  - `.../jarvis/workspace/memory/YYYY-MM-DD.md`

- App state (non-editable by default):
  - `.../jarvis/state/memory-index.sqlite` (optional search index cache)
  - `.../jarvis/state/transcripts/*.jsonl`
  - `.../jarvis/state/audit/*.jsonl`

### MVP recommendation

To avoid over-engineering early:

- Use workspace Markdown files as the memory source of truth (same as OpenClaw + nanobot).
- Skip embeddings in MVP.
- Implement basic keyword search by scanning recent memory files (or build a small index cache later).

### Post-MVP upgrades (high leverage)

- Add embeddings + hybrid search (FTS + vectors) using:
  - SQLite FTS5 for keywords
  - sqlite-vec (if feasible on Windows) or a pure-SQLite fallback
- Add "memory citations" (source path + line) for internal recall, and decide whether the UI shows those paths.
- Add optional transcript indexing (opt-in).

## Decisions to make explicitly

Decisions are now:

1) memory source of truth is workspace Markdown (accepted)
2) whether to add a search index cache (SQLite FTS/embeddings) and when
3) whether to implement pre-compaction memory flush in MVP or post-MVP
