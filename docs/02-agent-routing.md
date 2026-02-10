# Agent Routing

## Inputs

Each user request includes:

- `mode`: `general` | `code` (explicit user switch)
- `text`: normalized user text (from typing or STT)
- optional attachments:
  - files
  - images (future)
- optional `project_context`:
  - repo path (for code mode)

## Routing rules (MVP)

1. If user selects `code`, route to OpenCode.
2. Otherwise route to nanobot.

## Boundary rules

- The general agent never calls the code agent directly.
- The code agent never calls the general agent directly.
- Only the Desktop app can:
  - change mode
  - trigger OS-level tools
  - unify logs
  - map permission requests into user confirmations

## Session model

JARVIS maintains:

- `jarvis_session_id`: the visible conversation session
- `general_session_id`: the general agent's internal session key
- `code_session_id`: the OpenCode session id

These IDs are not shared across agents.

## Context hygiene

To preserve separation:

- Do not inject general memory into OpenCode.
- Do not inject repository contents into general agent unless explicitly requested.
- Any user-provided snippets can be passed to either agent as user text.
