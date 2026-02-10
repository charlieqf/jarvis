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

## STT options

- Local: faster-whisper / whisper.cpp
- Remote: provider API (optional)

MVP recommendation: local-first with an opt-in remote fallback.

## TTS options

- Local: Windows voices, local TTS engine
- Remote: provider API (optional)

MVP recommendation: start with a reliable local TTS path, then add premium voices later.

## Failure handling

- If STT fails, preserve recorded audio and show an error with retry.
- If TTS fails, fall back to text-only.
