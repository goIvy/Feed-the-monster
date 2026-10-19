# Future Voices

Website for Future Voices, a public speaking and speech & debate program.

It's a single self-contained page: open `index.html` in a browser, or host it anywhere static
(GitHub Pages: Settings → Pages → deploy from the branch root).

## What's on it

- **Hero voice meter**: the letters of "Future Voices" pulse like a voice meter. Hover over them, or press
  and hold to "project". Click **Test your voice** to drive the meter from your microphone (audio stays in
  the browser; mic access needs the page served over HTTPS or from localhost).
- **Find your event**: nine events (debate, speech, interp). Pick one to see its round drawn to a shared
  80-minute scale, then press **Play the round** to watch a playhead run through it. Filter by category.
- **Practice Room**: an impromptu prompt deck (filter by quotation, word, object, question) and a speech
  clock with a progress ring and timekeeper-style cards (minutes left, 30 seconds, grace period, stop).
  Press Space to start or pause.
- **How a season runs** (timeline that fills as you scroll), a searchable **glossary** of debate terms,
  and a **sign-up form**.

## Photos

The three photos were generated with Higgsfield AI and are loaded from Higgsfield's image host
(`d8j0ntlcm91z4.cloudfront.net`). To host them yourself, download them into the repo and change the three
`src` URLs in `index.html`. If a photo fails to load, the page falls back to a dark gradient.

## Connecting the sign-up form

The form doesn't send anything until you connect it. In `index.html`, set `FORM_ENDPOINT` to a
form-service URL (Formspree, a Google Apps Script web app, etc.). It receives a JSON POST with
`name`, `grade`, `email`, `events`, and `note`.

## Editing content

Events, impromptu prompts, speech clock presets, glossary terms, and the ticker lines are plain arrays in
the `<script>` block (`EVENTS`, `PROMPTS`, `PRESETS`, `TERMS`, `lines`).
