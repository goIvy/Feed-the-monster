# Public Voices

Website for Public Voices, a public speaking and speech & debate program.

It's a single self-contained page: open `index.html` in a browser, or host it anywhere static
(GitHub Pages: Settings → Pages → deploy from the branch root).

## What's on it

- **Kinetic headline**: the letters of "Public Voices" pulse like a voice meter. Hover over them, or press and hold to "project".
- **Find your event**: nine events (debate, speech, interp) with round formats drawn to one shared time scale. Filter by category.
- **Practice Room**: an impromptu prompt draw and a speech clock with timekeeper-style cards (minutes left, 30 seconds, grace period, stop). Press Space to start or pause.
- **How a season runs**, a **glossary** of debate terms, and a **sign-up form**.

## Connecting the sign-up form

The form doesn't send anything until you connect it. In `index.html`, set `FORM_ENDPOINT` to a
form-service URL (Formspree, a Google Apps Script web app, etc.). It receives a JSON POST with
`name`, `grade`, `email`, `events`, and `note`.

## Editing content

Events, impromptu prompts, speech clock presets, and the ticker lines are plain arrays near the
top of the `<script>` block (`EVENTS`, `PROMPTS`, `PRESETS`, `lines`).
