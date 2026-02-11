# UI Review and Recommendations (Windows-First)

This doc reviews the current UI design direction (`14-ui-design.md`) and the mockups in `jarvis/docs/mockups/`.
It then recommends a refined direction optimized for a **Windows-native local productivity + coding** assistant.

## What works well in the current mockups

- **Clear product shape**: sidebar + chat + input, with a dedicated permission dialog.
- **Trust cues**: visible status indicators and explicit approval modal are aligned with the safety model.
- **Voice-first intent**: PTT is treated as a primary interaction, not a hidden feature.

## What to improve (to avoid "generic sci-fi chatbot" vibes)

- **Overuse of glow + blur**: heavy neon edges and multiple glass layers can feel template-like and will be performance-sensitive on Windows WebView.
- **Purple-leaning surfaces**: some surfaces skew toward blue/purple. Prefer neutral graphite + restrained accent.
- **Voice screen is too dominant**: the large microphone panel reads as a separate app mode rather than a quick overlay.
- **Status clutter**: multiple status labels can compete with the conversation (user's primary focus).

## Recommended aesthetic: "Instrument panel" Fluent

Target feel:

- Looks at home on Windows 11 (Fluent-like)
- Reads as a *control surface* (tooling + approvals), not a toy
- Uses glow sparingly (only to indicate active recording, active run, or risk)

## Typography recommendation

Use Windows-native typography by default.

- UI font: `Segoe UI Variable` (fallback `Segoe UI`, then system UI)
- Monospace: `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`

Optional: add a display font for the wordmark only (not body text) if you want stronger brand.

## Color system recommendation (more neutral)

Keep the cyan accent, but reduce saturation and move backgrounds to neutral graphite.

Suggested tokens (directional):

```css
:root {
  --bg-primary:   #0B0D10; /* neutral graphite */
  --bg-panel:     #101419;
  --bg-surface:   #131922;
  --bg-elevated:  #18202B;

  --text-primary:   #E7E9EE;
  --text-secondary: #A7AFBE;
  --text-muted:     #6B7280;

  --accent:       #46D6E9; /* quieter cyan */
  --accent-2:     #FF8A4C; /* warm highlight */

  --ok:    #2BD4A6;
  --warn:  #F7B955;
  --bad:   #FF5A6B;

  --border: rgba(255,255,255,0.08);
  --shadow: 0 12px 40px rgba(0,0,0,0.55);
}
```

Rule of thumb: if it glows, it must mean something (listening / processing / asking approval).

## Layout recommendation

### Keep single-window core UI

Use one main window, but support a compact "quick panel" later (Alt+Space pattern).

### Sidebar

- Default: slim, high-contrast list of conversations.
- Collapsed state: icon rail.
- Include a small, explicit mode chip (`General` / `Code`) and show the selected repo name when in code mode.

### Chat stream

- Prefer a **single transcript** for the user, but internally route per-mode sessions.
- Use **run cards** for tool output (collapsible), especially in code mode:
  - command executed
  - files changed
  - patches/diffs
  - test results

### Input bar

- Make typing feel premium: good caret, selection, code paste handling.
- PTT behavior stays: hold to record, release inserts transcript into input before sending.

## Permission UX recommendation

The current modal is a good start. Improve it for fast decision-making:

- Default to **Allow once** / **Deny** (avoid "Always" in MVP).
- Show a compact diff/command preview with copy button.
- Add a small "What happens if I deny?" hint (e.g., "JARVIS will continue without installing dependencies").

Consider presenting approval as a **bottom sheet** anchored above the input bar instead of a center modal. This keeps the user's spatial focus on "input -> actions".

## Voice UX recommendation

Replace the full-screen microphone panel with a smaller overlay:

- A compact pill above the input bar:
  - status (Listening/Transcribing)
  - waveform (thin)
  - partial transcript
- Only use the big overlay for accessibility mode (large controls) or a dedicated "Talk mode".

## Motion recommendation

Use fewer animations, but make them meaningful:

- Streaming: a subtle caret + block-level reveal (not constant pulsing).
- Listening: ring pulse around mic button only.
- Permission requested: gentle shake/attention pulse on the approval sheet.

## Practical implementation notes

- Prefer fewer blurred layers; rely on opacity + subtle noise texture.
- Add a "Reduce effects" toggle that disables blur and reduces motion.
- Use Fluent-like iconography (simple, consistent stroke weight).

## Next step

If you want to lock this in, we should update `14-ui-design.md` to:

- switch font guidance to Segoe UI Variable
- adjust palette to neutral graphite
- redefine voice active state as overlay-first
- define run cards + diff viewers as first-class components for code mode
