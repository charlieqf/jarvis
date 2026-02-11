# MVP Checklist

This is the minimum set of features needed to satisfy PRD v1.0 MVP scope.

## Desktop shell

- [ ] Tauri app launches on Windows 10/11
- [ ] System tray presence (open/mute/exit)
- [ ] Unified chat window with streaming
- [ ] Explicit mode switch: General / Code

## Voice

- [ ] Push-to-talk STT
- [ ] Interruptible TTS playback
- [ ] Clear "listening/processing/speaking/idle" indicators

## General agent (nanobot-based)

- [ ] Runs as a local service
- [ ] Persistent memory (workspace Markdown: `memory/MEMORY.md` + `memory/YYYY-MM-DD.md`)
- [ ] Tool access restricted to a workspace
- [ ] No unbounded shell access

## Code agent (OpenCode)

- [ ] OpenCode runs as local sidecar server
- [ ] Desktop can select repo directory per request
- [ ] Desktop streams progress
- [ ] Permission prompts are surfaced in UI

## OS actions

- [ ] App launch: whitelisted apps only
- [ ] Command execution: whitelisted commands only
- [ ] Confirmation for risky actions
- [ ] Human-readable audit logs

## Reliability

- [ ] Desktop stays responsive if a sidecar crashes
- [ ] Auto-restart sidecars on crash (bounded retry)
- [ ] Clear error messages and recovery actions

## Security

- [ ] No unrestricted shell
- [ ] No self-modifying code
- [ ] Permissions and logs are visible to the user
