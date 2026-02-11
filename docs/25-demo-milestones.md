# Demo Milestones (Static -> Fake -> Real)

This plan defines demo checkpoints to collect user feedback early while we follow a contract-first implementation.

Principle:

- Show something useful as early as possible.
- Increase realism milestone by milestone.
- Do not wait for full backend completion to get UX/product feedback.

## Milestone ladder

## M0 - Static visual prototype (no backend)

Stage: **static/fake**

What to demo:

- Main chat window (single-window layout, conversation list, mode switch)
- Permission sheet visual state
- Voice overlay visual state (listening/transcribing/speaking)
- Run card visuals (command/patch/test)

Implementation level:

- Pure frontend screens with hardcoded JSON fixtures
- No Tauri/Rust required

Feedback to collect:

- Does this feel native and trustworthy on Windows?
- Is permission UX understandable at a glance?
- Is code-mode output readable (run cards vs text blob)?

Exit criteria:

- Visual direction validated by 3-5 target users
- No major layout confusion reports

---

## M1 - Interactive fake flow (contract replay)

Stage: **interactive fake**

What to demo:

- User types a message -> stream appears token-by-token
- Tool request appears -> user approves/denies -> transcript updates
- Mode switch between General and Code

Implementation level:

- UI consumes `jarvis/contracts/examples/*` replay sequences
- Simulated timing (stream delays, permission waits)

Feedback to collect:

- Does streaming feel responsive enough?
- Is approval flow too frequent / too noisy?
- Is mode-switch mental model clear?

Exit criteria:

- Users can complete 3 scripted tasks without guidance
- Approval and run-card interactions are understandable

---

## M2 - Dynamic local stubs + Desktop supervisor

Stage: **dynamic fake**

What to demo:

- Real Tauri app launching sidecar stubs
- Health status indicators, crash/restart banner
- Live SSE from stubs into transcript
- Audit log entries append in real time

Implementation level:

- Rust sidecar lifecycle + event bus + permission gate
- Stub General service + Stub OpenCode service

Feedback to collect:

- Does the app feel stable under sidecar failures?
- Are status and errors understandable?
- Is audit output useful or too technical?

Exit criteria:

- Sidecar crash recovery works repeatedly
- End-to-end approval loop works with stubs

---

## M3 - Real General mode (nanobot-derived)

Stage: **partially real**

What to demo:

- Real general-agent responses with streaming
- Real workspace memory writes (`memory/MEMORY.md`, daily logs)
- Real tool boundary: whitelisted app launch and whitelisted commands

Implementation level:

- Replace General stub with real service
- Keep OpenCode on stub if needed

Feedback to collect:

- Is memory behavior predictable and trustworthy?
- Are allowed actions useful in daily productivity?
- Is the assistant "helpful enough" without code mode fully real?

Exit criteria:

- At least 5 real user tasks completed in General mode
- No unsafe tool execution paths found

---

## M4 - Real Code mode (OpenCode integration)

Stage: **mostly real**

What to demo:

- Real OpenCode session flow in selected repo
- Run cards from real events (commands/patches/tests)
- Permission prompts tied to real code actions

Implementation level:

- Replace OpenCode stub with `opencode serve`
- Use `x-opencode-directory` routing and permission API

Feedback to collect:

- Is this better than using OpenCode directly in terminal/browser?
- Are run cards + diff UX materially useful?
- Is approval granularity right for coding work?

Exit criteria:

- End-to-end code fix flow works in at least 2 real repos
- Users can follow "what changed" without opening raw logs

---

## M5 - Voice + interruption (real-time UX)

Stage: **real-time real**

What to demo:

- Push-to-talk to text input
- TTS playback with immediate interrupt
- Smooth transitions with no UI lockups

Implementation level:

- Real Rust audio capture/playback path
- STT/TTS providers wired (local default)

Feedback to collect:

- Is voice fast enough to be habitual?
- Does interruption feel instant and natural?

Exit criteria:

- Stable PTT and interrupt in 30+ minute sessions

---

## M6 - Dogfood pilot build

Stage: **real usage**

What to demo:

- Installer build for internal pilot users
- Daily use in local productivity + coding workflows

Implementation level:

- Packaging + reliability hardening
- Basic diagnostics and "doctor" checks

Feedback to collect:

- What do users use repeatedly vs ignore?
- What trust/safety concerns remain?
- Which failures block continued usage?

Exit criteria:

- Weekly retention among pilot users
- Clear top-3 backlog from real behavior (not assumptions)

## Demo script template (use for every milestone)

- Context: who the user is and what task they need done
- 3-minute scripted flow
- 2-minute free exploration
- 5 feedback questions (clarity, trust, speed, usefulness, confusion)
- Log outcomes in `jarvis/docs/progress/progress-log.md`

## What not to do

- Do not wait for all backends to be real before testing UX.
- Do not collect only "looks good" feedback; always ask task-completion questions.
- Do not change contracts during a milestone unless it is a blocking issue.

## Related docs

- `jarvis/docs/21-implementation-plan-contract-first.md`
- `jarvis/docs/14-ui-design.md`
- `jarvis/docs/22-testing-strategy.md`
- `jarvis/docs/progress/status.md`
