# Runbook

## Development layout

- PRD: `jarvis/PRD.txt`
- Reference repos: `jarvis/code_reference/*`
- Design docs: `jarvis/docs/*`

## Local dev: what must be running

1. JARVIS Desktop app (Tauri)
2. OpenCode server (either started by Desktop or manually)
3. General agent service (started by Desktop or manually)

## Health checks

- OpenCode: `GET http://127.0.0.1:<port>/global/health`

## Common issues

- Proxy/VPN breaks localhost calls:
  - ensure loopback is excluded from proxy (NO_PROXY)
- Port conflicts:
  - allow Desktop to pick a free port and store it

## Logging

- Desktop logs tool calls, permissions, and results
- Sidecars log internal errors; Desktop surfaces a "sidecar crashed" banner
