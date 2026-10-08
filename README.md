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

---

# Future Voices

`future-voices/index.html` is the website for **Future Voices**, a Feed the Monster program that
teaches young people public speaking, confidence, and speech & debate through games and activities.
On GitHub Pages it lives at `/future-voices/`.

It's one self-contained page with:

- **Quick debate card** (hero): draws a kid-friendly topic, assigns a side, and runs a 60-second speaking clock.
- **Program pillars**: confidence, public speaking, speech & debate.
- **Activities**: 12 games, filterable by skill.
- **A 60-minute chapter meeting**, drawn to scale.
- **Five-level skill path**: Spark, Story, Stage, Spar, Showcase.
- **Chapters**: roles, four steps to start one, a starter kit, an application form, and a chapter directory.
- **FAQ**.

## Editing Future Voices

Everything you'd change often is a plain list near the top of the `<script>` block:
`TOPICS` (debate topics), `GAMES` (activities), `MEETING` (meeting agenda), and `CHAPTERS`
(the directory: add `{ name, place, since }` once a chapter holds its first meeting).

To receive chapter applications, set `FORM_ENDPOINT` to a form-service URL (Formspree, a Google
Apps Script web app, etc.). It receives a JSON POST with `role`, `name`, `email`, `organization`,
`location`, `ages`, and `why`.
