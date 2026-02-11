# JARVIS Contracts

This folder defines contract-first interfaces used to develop JARVIS in parallel.

Goals:

- Frontend can be built against stable event/command shapes.
- Backend can validate emitted payloads and keep compatibility.
- Stubs can simulate realistic behavior without needing real LLMs.

## Files

- `jarvis/contracts/schemas/jarvis.desktop.protocol.schema.json`
  - Desktop <-> UI IPC command and event envelopes.

- `jarvis/contracts/schemas/jarvis.general-agent.protocol.schema.json`
  - General Agent Service HTTP request bodies and SSE event payloads.

- `jarvis/contracts/schemas/jarvis.tool-boundary.schema.json`
  - Tool request / approval / result shapes shared across domains.

- `jarvis/contracts/types.ts`
  - TypeScript types for the UI (hand-maintained, mirrors schemas).

## Notes

- Schemas use JSON Schema 2020-12.
- Examples under `jarvis/contracts/examples/` are "golden" payloads.
- A validator script (Ajv) can be added once we have a Node workspace.
