# PL-9 — UI revamp

## Goal

The recording and playback screens use shadcn defaults: a live sound waveform above a large centered timer, a normal shadcn badge for the language, shadcn progress for playback, shadcn buttons without hand-written styling, and the default shadcn neutral dark theme instead of the custom yellow palette. The spinning recording icon is gone.

## Tech stack

- **Styling:** Tailwind v4 and the existing CSS variables in `apps/web/src/index.css`.
- **UI primitives:** shadcn registry components plus the existing `Button`/`Input`; no bespoke styling for controls.
- **Language selector:** shadcn Combobox pattern — `Popover` + `Command` (`cmdk`), preserving search and keyboard selection.
- **Waveform:** SVG bars driven by a Web Audio `AnalyserNode` attached to the active recorder stream.
- **Theme:** shadcn neutral dark palette with `.dark` on the document root; the app remains dark-only.

## Scope

The web app already has working recording, playback, language selection and transcript flows. This item changes their presentation, layout and primitive components.

- **Timer**
  - The timer is a `div`, not a paragraph, with the timer role and accessible text as needed.
  - The timer text is 5rem (`text-[5rem]`), white, and uses tabular numerals.
  - The timer is centered in the panel.
- **Live waveform**
  - Show an SVG waveform above the timer.
  - Source its levels from the active microphone stream through an `AnalyserNode`; do not open a second microphone stream.
  - Use time-domain samples across the whole analyser buffer so every bar moves with the sound, not only the low-frequency bars.
  - Smooth level changes with a low-pass filter and a relaxed update cadence so the wave flows instead of jittering.
  - Leave extra vertical space between the waveform and the timer.
  - The waveform animates while recording and settles to a flat line while paused or idle.
  - Keep the timer centered below it.
- **Recording indicator**
  - Remove the spinning disc entirely.
- **Buttons**
  - Pause/resume and playback use shadcn `Button` `variant="outline"` with a shadcn icon size.
  - Stop uses shadcn `Button` `variant="destructive"` with a shadcn icon size.
  - Record uses shadcn `Button` `variant="default"` with a large size override only.
  - The recording-page pause and stop controls are larger than the default icon size, with proportionally larger icons.
  - No hand-written radius, background, border or text-color classes on these buttons.
- **Badge**
  - Add the shadcn `Badge` component.
  - The language tag is a shadcn `Badge` (`variant="secondary"`), smaller than the previous custom pill.
  - Remove `LanguageTag`.
- **Progress**
  - Add the shadcn `Progress` component.
  - Playback uses it with the existing playback position/duration values and accessible label.
  - Remove `PlaybackProgressBar`.
- **Language selector**
  - Replace the custom combobox leaves with the shadcn Combobox pattern: `Popover`, `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup` and `CommandItem`.
  - Keep the native-label display, English labels in search, diacritic-insensitive search, keyboard navigation, selection and disabled state.
  - The generic combobox UI is a separate `Combobox` component; `LanguageSelect` only adapts language data and filtering.
  - Remove `LanguageOptions`, `LanguageOptionRow`, `LanguageSearchField`, `LanguageTrigger`, `List` and `ListItem`.
- **Title and language tag**
  - The title is small, light and not bold.
  - The title/tag row spans the full width and uses `justify-between`, so the badge is pinned to the right in recording and playback.
  - The title remains click-to-edit and stays left-aligned.
- **Transcript**
  - In the recording and playback states, the transcript region is always present, even before the first text, and occupies the remaining vertical height below the header and controls, down to the bottom of the viewport.
  - Long transcript content scrolls vertically inside the region instead of growing the page.
  - During recording, the region follows new final and partial text by scrolling to the bottom.
  - The playback transcript uses the same growing, scrollable region.
  - The idle state keeps its centered record button and language selector layout.
  - The recording and playback views keep bottom padding so transcript text never touches the bottom edge of the viewport.
- **Theme**
  - Restore the default shadcn neutral palette (light `:root` plus `.dark` overrides) and put `class="dark"` on `<html>`.
  - Remove the custom black/yellow/red/blue palette and the `--record` / `--record-hover` tokens.
  - No yellow text remains.
- **Component layering**
  - `src/components/` holds only pure UI building blocks with no business logic.
  - Each screen lives in `src/views/<View>/` with an `index.ts` barrel, a `<View>.tsx` screen and a `components/` folder.
  - `src/views/<View>/components/` holds components owned by one view and composed from the UI lib.
  - `src/views/components/` holds shared view-layer components: more than pure UI, but not tied to one view. `LanguageSelector` lives here.
  - Recorder-specific components (`Timer`, `Transcript`, `Waveform`, `RecordingTitle`, `RecordButton`, `PauseResumeButton`, `StopButton`) move under `views/RecorderView/components/`.
  - `LanguageSelect` is renamed `LanguageSelector` and moved under `views/components/`.
  - The architecture is documented in `apps/web/README.md` and `AGENTS.md`.
- **App layout**
  - The app shell is bounded to the viewport height (`h-dvh`) so the transcript's `flex-1` and `overflow-y-auto` can take effect.

## References

- UI revamp request and screenshots shared in the conversation.
- PL-8 visual baseline (`features/PL-8-star-trek-theme/spec.md`); its custom theme is superseded here.
- `apps/web/README.md` — component layering and shadcn conventions.
