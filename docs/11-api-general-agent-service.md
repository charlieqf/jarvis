# General Agent Service API

This document defines the HTTP API contract between the JARVIS Desktop app and the General Agent Service (nanobot-based).

Goal: keep the desktop as the orchestrator, while the service provides general reasoning, memory, and tool planning.

## Design constraints

- Desktop owns the user-facing conversation.
- Desktop owns OS actions and safety gates.
- Service runs local-only (loopback), no public exposure.
- Service is stateless at the HTTP layer, stateful via explicit `session_id`.
- Streaming is first-class.

## Transport

- Protocol: HTTP on `127.0.0.1` (no 0.0.0.0 for MVP)
- Content types:
  - Requests: `application/json`
  - Streaming: `text/event-stream` (SSE)

## Identity and sessions

Terminology:

- `jarvis_session_id`: the desktop-visible conversation id
- `general_session_id`: the General Agent Service session id

Rules:

- Desktop maps `jarvis_session_id -> general_session_id`.
- Service never sees OpenCode ids or code-agent state.

## API overview

Required endpoints:

- `GET /health`
- `POST /v1/sessions`
- `POST /v1/chat`
- `GET /v1/stream` (optional alternative to streaming chat responses)
- `POST /v1/tools/execute` (Desktop-only execution gateway)
- `POST /v1/memory/write`
- `GET /v1/memory/search`

## Common envelope types

### MessagePart

```
{
  "type": "text",
  "text": "string"
}
```

Future parts:

- `type: "audio"` (desktop passes transcript only in MVP)
- `type: "image"` (desktop passes file references + base64 or URL)

### ToolCall

Tool calls are requests from the service to the desktop. The desktop may:

- auto-allow
- prompt the user
- deny

```
{
  "id": "toolcall_123",
  "name": "open_app",
  "arguments": { "app_id": "notion" },
  "risk": "safe" | "risky" | "forbidden",
  "reason": "why this action is needed"
}
```

### ToolResult

```
{
  "id": "toolcall_123",
  "ok": true,
  "result": "string",
  "error": null
}
```

## Endpoint specs

### GET /health

Response:

```
{
  "healthy": true,
  "version": "0.1.0",
  "uptime_ms": 12345
}
```

### POST /v1/sessions

Create (or resume) a service session.

Request:

```
{
  "jarvis_session_id": "j_abc",
  "preferred_session_id": "optional_existing_general_session_id"
}
```

Response:

```
{
  "general_session_id": "g_def"
}
```

### POST /v1/chat

Send a user message to the general agent.

Request:

```
{
  "general_session_id": "g_def",
  "mode": "general",
  "message": {
    "parts": [
      { "type": "text", "text": "Plan my week" }
    ]
  },
  "stream": true
}
```

If `stream=false`, response is a single final payload:

```
{
  "assistant": {
    "parts": [
      { "type": "text", "text": "..." }
    ]
  }
}
```

If `stream=true`, response is SSE.

SSE event types:

- `assistant.delta` (partial text)
- `assistant.final` (final text)
- `tool.request` (tool call request)
- `tool.result` (tool call result)
- `error`

Example SSE stream:

```
event: assistant.delta
data: {"text":"Sure - "}

event: assistant.delta
data: {"text":"here's a plan..."}

event: tool.request
data: {"id":"toolcall_1","name":"open_app","arguments":{"app_id":"calendar"},"risk":"risky","reason":"Need to check availability"}

event: assistant.final
data: {"text":"Done."}
```

### POST /v1/tools/execute

Desktop calls this endpoint to deliver tool results, or the service calls desktop via a reverse channel.

For MVP simplicity, avoid reverse callbacks and do this:

- Service emits `tool.request` via SSE
- Desktop executes the tool locally
- Desktop posts the `tool_result` back to the service

Request:

```
{
  "general_session_id": "g_def",
  "tool_result": {
    "id": "toolcall_1",
    "ok": true,
    "result": "Launched Calendar",
    "error": null
  }
}
```

Response:

```
{ "accepted": true }
```

### POST /v1/memory/write

Request:

```
{
  "general_session_id": "g_def",
  "kind": "preference" | "decision" | "note",
  "title": "string",
  "content": "string",
  "tags": ["string"]
}
```

Response:

```
{ "id": "mem_123" }
```

### GET /v1/memory/search

Query params:

- `q`: search string
- `kind`: optional
- `limit`: optional

Response:

```
{
  "items": [
    {
      "id": "mem_123",
      "kind": "decision",
      "title": "...",
      "content": "...",
      "tags": ["..."],
      "created_at": "2026-02-10T00:00:00Z"
    }
  ]
}
```

## Error model

All non-2xx responses:

```
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Security requirements

- Bind to loopback only.
- No arbitrary file access outside the service workspace.
- No raw shell execution in MVP, or enforce a strict allowlist.
- Desktop is the final authority for OS tools.
