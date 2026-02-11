# Runbook

## Development layout

- PRD: `jarvis/PRD.txt`
- Reference repos: `jarvis/code_reference/*`
- Design docs: `jarvis/docs/*`

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JARVIS_GENERAL_PORT` | No | auto | Port for General Agent Service |
| `JARVIS_OPENCODE_PORT` | No | auto | Port for OpenCode server |
| `OPENCODE_SERVER_PASSWORD` | No | — | Auth password if OpenCode is non-loopback |
| `OPENAI_API_KEY` | Yes | — | LLM provider API key (or equivalent) |
| `JARVIS_STT_BACKEND` | No | `local` | `local` or `remote` |
| `JARVIS_TTS_BACKEND` | No | `local` | `local` or `remote` |
| `JARVIS_LOG_LEVEL` | No | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |
| `NO_PROXY` | Recommended | — | Should include `127.0.0.1,localhost` |

## Local dev: startup commands

### 1. General Agent Service

```powershell
# From the general-agent-service directory
cd jarvis\general-agent-service
python -m uvicorn main:app --host 127.0.0.1 --port 8100
```

Health check: `GET http://127.0.0.1:8100/health`

Expected response:
```json
{ "healthy": true, "version": "0.1.0", "uptime_ms": 12345 }
```

### 2. OpenCode server

```powershell
opencode serve --hostname=127.0.0.1 --port=8200
```

Health check: `GET http://127.0.0.1:8200/global/health`

### 3. JARVIS Desktop app (Tauri)

```powershell
# From the desktop app directory
cd jarvis\desktop
npm run tauri dev
```

In production, the Desktop app starts both sidecars automatically. For development, you can start them manually (as above) and configure the Desktop to skip auto-start via `config.json`:

```json
{ "auto_start_sidecars": false, "general_agent_port": 8100, "opencode_port": 8200 }
```

## Health checks

| Service | Endpoint | Expected |
|---------|----------|----------|
| General Agent | `GET http://127.0.0.1:<port>/health` | `200` with `{ "healthy": true }` |
| OpenCode | `GET http://127.0.0.1:<port>/global/health` | `200` |
| Desktop App | — | App window opens, system tray icon appears |

## Common issues

### Proxy/VPN breaks localhost calls

Ensure loopback is excluded from proxy:

```powershell
$env:NO_PROXY = "127.0.0.1,localhost"
```

Or set permanently in Windows environment variables.

### Port conflicts

If a port is already in use:

1. Check what's using it: `netstat -ano | findstr :<port>`
2. Either kill the conflicting process or choose a different port via env var.
3. In production, Desktop auto-picks free ports so this is only a dev concern.

### Sidecar won't start

1. Check that Python / OpenCode is on PATH.
2. Check sidecar logs:
   - General Agent: `%APPDATA%/jarvis/logs/general-agent.log`
   - OpenCode: `%APPDATA%/jarvis/logs/opencode.log`
3. Run the sidecar manually (see startup commands above) to see error output.

### STT/TTS not working

1. Verify a microphone/speaker is connected and set as default.
2. For local STT: ensure `faster-whisper` or `whisper.cpp` model files are downloaded.
3. Check `JARVIS_STT_BACKEND` / `JARVIS_TTS_BACKEND` env vars.

## Logging

- Desktop logs tool calls, permissions, and results to the audit log.
- Sidecars log internal errors to their respective log files.
- Desktop surfaces a "sidecar crashed" banner on unexpected sidecar exit.
- Set `JARVIS_LOG_LEVEL=debug` for verbose output during development.

## See also

- `11-api-general-agent-service.md` — General Agent API contract and endpoints
- `03-integrations-opencode.md` — OpenCode process model and messaging
- `13-desktop-app.md` — Desktop app sidecar lifecycle and configuration
