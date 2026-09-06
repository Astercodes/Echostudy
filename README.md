# EchoStudy

An intentional learning workspace that connects **time → goals → study objectives → knowledge → reflection → growth**.

Built with React, Vite, Lucide icons, and PDF.js. Designed for Vercel, with citrus-inspired accents and an organic knowledge tree.

## What works

- **24-hour planner:** edit daily blocks, reject overlaps, protect commitments, and find study windows between 06:00 and 23:00. Generated deep blocks are capped at 90 minutes, with 15-minute recovery breaks when room permits. Requests that cannot fit are reported.
- **Goal architecture:** yearly, quarterly, monthly, weekly, and daily goals across six life areas. Goals can link to a longer horizon. Parent progress averages its children.
- **Intentional study:** a topic, objective, and linked goal are required before starting. Optional concepts and resources attach to sessions.
- **Focus timer:** tracks planned versus actual elapsed focus, pause history, notes, and post-session reflection. Active and paused sessions survive browser reloads. Finishing does not count as an interruption.
- **Knowledge tree:** editable roots and branches, curved connections, cross-links, zoom and pan, confidence, applications, review dates, and concept-linked notes.
- **Knowledge suggestions:** transparent rules identify declared prerequisite gaps, developing concepts, missing cross-links, unapplied concepts, and overdue reviews.
- **Resource library:** upload PDF, TXT, Markdown-as-text, audio, or video; save external URLs. PDF.js renders PDFs with selectable text. Selected PDF passages retain highlights across pages and reloads. Text selections can become connected notes. Audio/video play in the browser.
- **Reflection and growth:** daily reflection, session history, focused versus planned minutes over the last seven days, and goal progress.
- **Persistence and backups:** browser localStorage for workspace data, IndexedDB for uploaded files, JSON export/import with schema and cycle checks.

The initial day, goal hierarchy, and knowledge tree are **editable examples**, not claims about your habits or accomplishments. Progress starts at zero.

## Run locally

Use Node.js 22 or newer.

```sh
npm install
npm run dev
```

Or use the committed pnpm lockfile:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Build and test

```sh
npm test
npm run build
npm run preview
```

Browser tests require Playwright's Chromium browser and a running development or preview server:

```sh
npx playwright install chromium
npm run dev
# In another terminal:
npm run test:browser
```

Set `ECHO_URL` to test a different local server, and optionally `ECHO_BROWSER=msedge` to use an installed Microsoft Edge browser. Tests cover timer pause/reload recovery, session completion, overlap rejection, goal and concept creation, resource persistence, notes, reflections, PDF selection/highlighting/navigation, and mobile layout. Screenshots are written to the ignored `test-results/` directory.

## Deploy on Vercel

1. Import the GitHub repository **Astercodes/Echostudy** into Vercel.
2. Select the **Vite** framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy. No environment variables or API keys are required.

The checked-in `vercel.json` defines the build/output settings and SPA fallback. This repository does not create or use ChatGPT Sites infrastructure.

## Storage and current boundaries

This is a functional **single-device first version**, with no server, authentication, or cloud synchronization. Each browser/origin has its own workspace. Preview URLs and production URLs have separate storage.

- Export backups regularly. Clearing site data removes your workspace.
- JSON exports include notes, sessions, and resource metadata **but not uploaded file bytes**. Keep original files and reattach them from the reader after restoring on another device.
- Uploads are limited to 100 MB per file and are also subject to browser storage quotas.
- Resource files are kept locally; opening an external URL contacts its source website.
- Knowledge suggestions are rule-based, not AI-generated judgments of understanding.
- The planner uses the fixed blocks you enter; it does not interpret free-form schedules or sync calendars.
- PDF text selection requires a text-based PDF. Scanned image-only PDFs can be viewed but need OCR before their text can be highlighted. Encrypted PDFs are not supported by this reader.
- PDF highlights are overlays stored in EchoStudy, not edits embedded into exported PDF files.
- Web resources open at their original URL; arbitrary sites are not scraped or embedded.
- Markdown is displayed as plain text. EPUB is not supported.
- The timer uses wall-clock timestamps while running; it cannot infer whether you are actually paying attention. Pause it when you step away. Sessions are attributed to their starting local calendar day.
- Goals use manually assessed progress, with rollups for parent goals. There are no background notifications or automated spaced-review scheduling.
- Fonts are loaded from Google Fonts when available, with system font fallbacks.

## Code map

- `src/App.jsx`: navigation, planner, goals, sessions, reflection, growth, and backup interface.
- `src/model.js`: scheduling, goal ancestry/progress, timer accounting, gap rules, seed data, and backup validation.
- `src/Knowledge.jsx`: tree layout, concept editor, and growth suggestions.
- `src/Resources.jsx`: library, reader, highlighting, and permanent notes.
- `src/files.js`: IndexedDB file storage.
- `src/styles.css`: responsive citrus/green visual system.
- `src/pdf-text-layer.css`: PDF.js text-layer styles, under the upstream Apache 2.0 license notice.
- `tests/`: model and browser workflow checks.

A future synchronized edition can replace the persistence boundary with authenticated database/file storage while retaining the study, goal, and knowledge models.
