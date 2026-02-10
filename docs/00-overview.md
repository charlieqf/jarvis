# JARVIS Overview

## Vision

JARVIS is a Windows 10/11 desktop AI assistant that is:

- Local-first by default
- Voice-enabled (push-to-talk STT, interruptible TTS)
- Agent-driven (tool use, planning, memory)
- Explicitly safe (bounded OS actions, observable logs, confirmations)
- Split into separate intelligence domains:
  - General assistant (life/work tasks)
  - Code assistant (software development tasks)

JARVIS is not "a chat UI". The UI is a control surface for agents.

## Goals (MVP)

- Desktop UI with mode switch: General / Code
- Streaming responses
- Voice input (push-to-talk) and voice output (interruptible)
- General agent integration (nanobot-based) with persistent memory
- Coding agent integration (OpenCode-based)
- Controlled OS actions (launch whitelisted apps, run whitelisted commands)
- Clear permission boundaries and audit logs

## Non-goals (MVP)

- Always-on wake word
- Unrestricted shell access
- Unbounded autonomous self-improvement
- Multi-user / enterprise tenancy
- Mobile / cross-device sync

## Principles

- Agent-first, UI-second
- Local-first, cloud optional
- Separation of intelligence domains (no shared memory store)
- Explicit action authority (actions are tool-based, bounded, observable)
