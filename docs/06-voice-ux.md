# Voice UX

## Requirements

- Push-to-talk activation
- Low-latency transcription (target < 1s for partial text)
- Spoken responses (TTS)
- Interruptible playback

## Recommended architecture

Voice runs in the Desktop app (or a local audio service controlled by Desktop).

Pipeline:

1. Capture microphone audio while PTT pressed
2. Stream to STT backend and display partial text
3. On release, finalize transcript and send as user message
4. For responses, stream text into TTS playback
5. Interrupt on user action (PTT press, stop button)

## Audio specifications

### Capture format

| Parameter | Value | Notes |
|-----------|-------|-------|
| Sample rate | 16 kHz | Whisper native rate; avoids resampling |
| Bit depth | 16-bit PCM | Standard for speech processing |
| Channels | Mono | Single-channel is sufficient for voice |
| Container | WAV (raw) | Sent to STT as raw PCM or WAV |

### Recording limits

- **Max duration**: 120 seconds per PTT press (prevents accidental infinite capture)
- **Min duration**: 300ms (ignore very short presses as accidental taps)
- **Buffer strategy**: ring buffer in Rust backend; if max duration is reached, auto-release and finalize

### Audio device selection

- Default to the OS default input/output devices.
- Allow override in Settings panel (dropdown of available devices).
- Re-enumerate devices on settings open (handle hot-plug).

## STT options

- Local: faster-whisper / whisper.cpp
- Remote: provider API (optional)

MVP recommendation: local-first with an opt-in remote fallback.

### Partial transcript display

- Local STT (faster-whisper): process audio in 1-second chunks while recording; display intermediate results.
- Debounce UI updates to every 300ms to prevent visual jitter.
- Show partial text in a distinct style (e.g., italic or dimmed) to indicate it is not yet final.
- On PTT release, run final transcription pass and replace partial text with the definitive transcript.

## TTS options

- Local: Windows voices, local TTS engine
- Remote: provider API (optional)

MVP recommendation: start with a reliable local TTS path, then add premium voices later.

### TTS behavior

- Begin playback as soon as the first sentence boundary is detected in streamed response text.
- Queue subsequent sentences for continuous playback.
- On interrupt (PTT press or stop button): halt playback immediately and discard queued audio.

## PTT interaction with dialogs

When a **permission confirmation dialog** is open:

- PTT is **disabled** — mic capture does not start.
- Rationale: prevents accidental transcription while the user is reading a confirmation prompt.
- PTT re-enables automatically when the dialog is dismissed.

When **TTS is playing**:

- PTT press **interrupts** TTS playback and begins new capture.

## Status indicators

The UI must clearly show the current voice state:

| State | Indicator | Description |
|-------|-----------|-------------|
| Idle | Mic icon (outline) | Ready for input |
| Listening | Mic icon (filled, pulsing) | PTT active, capturing audio |
| Processing | Spinner | STT is transcribing |
| Speaking | Speaker icon (animated) | TTS is playing response |

Transitions should animate smoothly (200ms fade).

## Failure handling

- If STT fails, preserve recorded audio and show an error with retry.
- If TTS fails, fall back to text-only.
- If the selected audio device is unavailable, show a banner and fall back to text input.

## See also

- `13-desktop-app.md` — Audio pipeline ownership and IPC commands
- `01-architecture.md` — Desktop app responsibilities
