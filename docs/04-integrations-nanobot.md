# nanobot Integration

This doc describes how JARVIS uses nanobot as the general-purpose agent engine.

## Why nanobot

nanobot provides a minimal, readable agent loop and tool registry:

- Loop: `jarvis/code_reference/nanobot/nanobot/agent/loop.py`
- Context + memory + skills: `jarvis/code_reference/nanobot/nanobot/agent/context.py`

It is small enough to adapt for a desktop-first assistant.

## Recommended runtime model

Run nanobot as a local service (Python) that exposes a narrow HTTP API to the Desktop app.

Reasons:

- keeps Python dependencies out of the UI process
- supports crash recovery (Desktop can restart service)
- makes logging and permissions explicit

## Workspace and sandboxing

nanobot supports restricting tool access to its workspace:

- config: `tools.restrict_to_workspace` in `jarvis/code_reference/nanobot/nanobot/config/schema.py`
- filesystem tools enforce `allowed_dir`: `jarvis/code_reference/nanobot/nanobot/agent/tools/filesystem.py`
- shell tool supports deny patterns and basic traversal checks: `jarvis/code_reference/nanobot/nanobot/agent/tools/shell.py`

For JARVIS MVP:

- enable workspace restriction
- disable direct shell execution or replace with Desktop-owned OS tools

## Memory

nanobot ships with file-backed memory (markdown under `workspace/memory`).
JARVIS PRD requires SQLite for persistent memory.

Plan:

- swap nanobot MemoryStore with a SQLite-backed store
- keep memory domain separate from OpenCode

## Tool boundary

To match JARVIS safety requirements:

- treat nanobot tools as "requests" that the Desktop app may approve/deny
- only expose safe, explicit tools to nanobot (e.g., `open_app(name)`, `run_whitelisted(cmd_id)`)

## What to ignore from nanobot

nanobot includes many chat-channel gateways (Telegram/Slack/etc.).
For a desktop-first JARVIS, these are optional and can be excluded from MVP.
