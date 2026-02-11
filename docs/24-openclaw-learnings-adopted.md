# OpenClaw Learnings We Adopt

This document captures specific OpenClaw patterns we adopt in JARVIS to avoid reinventing wheels.

JARVIS scope differs (Windows-native local productivity + coding), but the operational lessons apply.

Primary sources:

- Tools: https://docs.openclaw.ai/tools
- Security: https://docs.openclaw.ai/gateway/security
- Logging: https://docs.openclaw.ai/gateway/logging
- Memory: https://docs.openclaw.ai/concepts/memory
- Workspace: https://docs.openclaw.ai/concepts/agent-workspace

## Adopted patterns

### 1) Declarative tool policy (profiles)

Adopt:

- A config-driven policy for tools: allow/ask/deny.
- Profiles (e.g. `general:minimal`, `code:coding`).

Why:

- Avoids policy logic becoming scattered UI/backend conditionals.
- Makes behavior testable and explainable to users.

### 2) A "doctor" / "security audit" command

Adopt:

- A `jarvis doctor` that checks common footguns:
  - sidecars bound to loopback
  - dangerous commands denied
  - audit log enabled
  - workspace restrictions enabled
  - secrets not stored in plaintext

Why:

- Prevents misconfiguration incidents.
- Makes local-first setups easier to support.

### 3) Structured logging + redaction

Adopt:

- JSONL logs on disk for:
  - audit log (tool calls + approvals)
  - sidecar lifecycle

- Redaction rules for obvious secrets in tool summaries.

Why:

- Keeps diagnostics reliable.
- Reduces accidental key leakage.

### 4) Workspace as a product feature

Adopt:

- A user-visible workspace folder containing:
  - bootstrap files (AGENTS/USER/TOOLS)
  - memory files (MEMORY.md + daily logs)

Why:

- Durable instructions and memory live outside the model.
- Users can inspect/edit their assistant state.

### 5) Memory: source of truth is readable; search is an index

Adopt:

- Memory lives in Markdown files.
- Any index (keyword/embeddings) is a rebuildable cache.

Why:

- Avoids migrations and schema lock-in.
- Increases trust and debuggability.

### 6) Pre-compaction memory flush (post-MVP)

Adopt later:

- Before compaction, prompt the agent silently to store durable memory.

Why:

- Reduces memory loss when session history is summarized.

## Non-adopted (intentionally)

- Multi-channel messaging gateway (out of scope for JARVIS MVP)
- Remote node system (possible future, not required)

## Related docs

- `jarvis/docs/23-openclaw-learnings-memory.md`
- `jarvis/docs/05-tools-and-safety.md`
- `jarvis/docs/07-storage.md`
- `jarvis/docs/22-testing-strategy.md`
