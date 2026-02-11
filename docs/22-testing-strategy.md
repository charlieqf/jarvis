# Testing Strategy

This document defines the test approach and folder conventions for JARVIS.

Goals:

- Keep core safety and routing logic well-tested.
- Make it easy to test contracts and streaming behavior.
- Enable parallel development without brittle E2E-only coverage.

## Test layers

1) Contract tests (schemas + golden examples)
- Validate that stub servers, real sidecars, and Desktop emit payloads matching `jarvis/contracts/schemas/*`.
- Keep golden examples small and representative.

2) Unit tests
- Rust: pure functions for policy, routing, parsing, event normalization.
- Python: session state, tool proxy coordination, memory store.
- TS: reducers/state management, run card formatting, permission UI state machine.

3) Integration tests
- Desktop <-> stub sidecars: spawn, health, streaming, permission loop.
- Desktop <-> real OpenCode: health, event stream consumption, permission reply wiring.
- Desktop <-> general agent: tool.request -> tool.result resume.

4) E2E tests (minimal)
- A small set of Playwright tests for the UI flows that matter:
  - streaming message
  - permission approval
  - mode switch

## Folder conventions (planned)

Python (General Agent Service):

- `jarvis/agent/tests/unit/`
- `jarvis/agent/tests/integration/`

Rust (Tauri backend):

- Unit tests: `#[cfg(test)] mod tests` inside modules
- Integration tests: `jarvis/desktop/src-tauri/tests/`

Frontend (React/TS):

- Unit tests: `jarvis/desktop/src/__tests__/`
- E2E: `jarvis/desktop/e2e/`

Contracts:

- `jarvis/contracts/examples/` (goldens)
- Optional validator runner: `jarvis/contracts/tests/`

## Minimum test targets (MVP)

- Permission gate classification: safe/risky/forbidden + default decisions.
- Audit log write path.
- General agent tool wait/resume logic (no deadlocks).
- OpenCode event parsing and run card normalization.
- Contract validation for all emitted events.
