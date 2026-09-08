# EchoStudy

An intentional learning workspace that connects **time → goals → study objectives → knowledge → reflection → growth**.

Built with React, Vite, Lucide icons, PDF.js, and Supabase Auth. Designed for Vercel, with the supplied citrus palette and an organic knowledge tree.

## Account access

The public route is a landing page. The dashboard is gated behind email/password sign-in, signup, email confirmation, password reset, and sign-out. Supabase Auth is integrated with the browser client. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel project settings; never add a service-role key to the frontend. Configure your Supabase Auth redirect URLs for `/login` and `/reset-password`.

EchoStudy includes its public Supabase project URL and publishable key in `src/auth.js`, so the production build works without extra Vercel variables. These are browser-visible settings, not administrative credentials. To use another project, override both environment variables together. A partial override disables account access rather than mixing credentials from different projects.

Email confirmation is enabled on the connected project. In Supabase **Authentication → URL Configuration**, set **Site URL** to the production Vercel origin and allow that origin's `/login` and `/reset-password` URLs. New users must follow their confirmation email before signing in.

## What works

- **24-hour planner:** edit daily blocks, reject overlaps, protect commitments, and find study windows between 06:00 and 23:00. Generated deep blocks are capped at 90 minutes, with 15-minute recovery breaks when room permits. Requests that cannot fit are reported.
- **Goal architecture:** multiple yearly, quarterly, monthly, weekly, and daily goals in every life area. The supplied catalog includes 24 editable areas and 428 sub-areas. Add custom areas and sub-areas, rename them, filter by area/sub-area/horizon, and link goals to a longer horizon within the same area. Parent progress averages its children.
- **Intentional study:** a topic, objective, and linked goal are required before starting. Optional concepts and resources attach to sessions.
- **Focus timer:** tracks planned versus actual elapsed focus, pause history, notes, and post-session reflection. Active and paused sessions survive browser reloads. Finishing does not count as an interruption.
- **Knowledge tree:** editable roots and branches, curved connections, cross-links, zoom and pan, confidence, applications, review dates, and concept-linked notes.
- **Knowledge suggestions:** transparent rules identify declared prerequisite gaps, developing concepts, missing cross-links, unapplied concepts, and overdue reviews.
- **Resource library:** upload PDF, TXT, Markdown-as-text, audio, or video; save external URLs. PDF.js renders PDFs with selectable text. Selected PDF passages retain highlights across pages and reloads. Text selections can become connected notes. Audio/video play in the browser.
- **Reflection and growth:** daily reflection, session history, focused versus planned minutes over the last seven days, and goal progress.
- **Persistence and backups:** browser localStorage for workspace data, IndexedDB for uploaded files, JSON export/import with schema and cycle checks. Workspace and file storage are namespaced by the authenticated user ID.

The initial day, goal hierarchy, and knowledge tree are **editable examples**, not claims about your habits or accomplishments. Progress starts at zero.

## Barns: dimensions of capacity

Open **Barns** to explore 16 capacities distinct from your life areas. Select multiple capacities in a goal or at the start of a study session. Completed sessions contribute focused minutes to each selected Barn, with the session's original life-area/sub-area context preserved. Totals overlap across Barns and should not be summed.

Each Barn displays a colorful circular percentage chart and an animated cup that fills with recorded progress. Practical Stretch activities earn up to 60 percentage points toward ten completed-activity credits; partial completion earns fractional credit. Study earns up to 20 points toward ten full planned-duration session credits, with overtime capped per session. Goals earn up to 20 points toward five completed-goal credits, including partial progress. Only leaf goals count, with capacity tags inherited from parents to avoid hierarchy double-counting. These fixed milestones represent activity progress rather than a scientific measure of ability. Area and sub-area filters scope the calculation. Updating records or links can reduce a score; completed milestones cap at 100%. This practice-first weighting recalculates earlier percentages without changing saved records. Motion respects reduced-motion preferences.

## Stretch workspace

Plan a practical challenge with an objective, success criteria, linked goal, sub-area, one or more capacities, date, and planned duration. The life area follows the linked goal; choose a specific sub-area for the practice. Start it when doing begins, then record actual minutes, completion percentage, the outcome and the next thing to practise. Activities can be recorded after offline practice and results can be corrected. Minutes are entered by the user, not tracked by a background timer. Filters cover life area, sub-area, goal, and status. Only recorded results earn Barns credit; plans and work in progress do not. Goal progress is not automatically marked complete by an activity. Records retain their original context and are included in browser storage and JSON backups. Run `node tests/stretch-browser.cjs` against the fixture server for the full browser flow.

Use **Record capacity evidence** inside a Barn to retain a separate dated self-assessment and concrete example. Existing evidence stays saved. Older untagged sessions remain unassigned. Evidence and tags are included in browser persistence and JSON backups.

Run `node tests/barns-browser.cjs` against the fixture server to verify session tagging, evidence, filters, persistence and mobile layout.

## AI refinement in Stretch

In **Shape your stretch**, fill any activity, ability or success field and choose **Refine with AI** directly beneath those three questions. Only these three answers are sent to OpenAI. Goals, life areas, practice sub-areas, capacities and duration are neither sent nor refined. A preview shows suggested text, which replaces only those three fields after **Apply suggestion**. Changing those answers makes older suggestions inapplicable. No completed results, uploaded resources, or full workspace are sent. Manual editing works when AI is unavailable. Provider failures distinguish API quota/billing, invalid keys, model access, permissions, rate limits and invalid request configuration without returning raw provider messages.

Set `OPENAI_API_KEY` as a **server-only** Vercel environment variable and redeploy. Never use a `VITE_` prefix for this secret. Optional `OPENAI_STRETCH_MODEL` defaults to `gpt-4.1-mini`. The `/api/refine-stretch` Vercel function verifies the user's Supabase bearer token before invoking OpenAI. Supabase environment overrides must match the frontend project. It uses the [Responses API with structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), bounded input/output and timeouts, and `store: false` (this does not imply zero provider retention). The API key is never returned to the browser. Configure provider budget controls for this separately billed API usage. The 10-request/5-minute user throttle is per function instance and is not a durable global quota across scaling or cold starts.

The plain Vite development server does not run Vercel functions: use Vercel's local runtime with these environment settings to exercise a live integration. Tests use mocked provider responses: `node --test tests/refine-api.test.js` and `node tests/refine-browser.cjs` against the fixture server. Production activation and live model response quality require an API key and deployment verification.

## Working with goals

Open **Goals → Life areas** to explore or edit the starting catalog. **Add life area** creates another area, with optional sub-areas and a palette color. Each area has **Add a goal**, while **New goal** is available at the top of the page. There is no one-goal-per-horizon limit. Use the + beside a goal to create another child goal at a shorter horizon.

The 24 groups include the original Faith & spirituality; Mind & intellectual capacity; Emotional wellbeing & identity; Physical health & vitality; Knowledge & education; Skills & competence; Career & professional life; Business & entrepreneurship; Personal finance & wealth; Relationships & social life; Marriage & romantic partnership; Parenting & family life; Home & lifestyle; Discipline & personal effectiveness; Recreation & creative expression; and Purpose, contribution & legacy, plus Identity & self-knowledge; Character & virtue; Cognitive & brain development; Communication & expression; Leadership & influence; Community, citizenship & civic life; Digital & information life; and Safety, security & preparedness. Existing sub-area names and IDs are preserved; the expansion is additive.

Workspace schema 2 stores `lifeAreas` and stable goal `areaId` / `subAreaId` references. Version-1 account data and backups migrate automatically; existing goal IDs, progress, parent links, notes, sessions, and concepts are preserved. Renaming an area never changes its IDs. Sub-areas referenced by goals cannot be removed until those goals are moved. Exported backups include all custom areas and their sub-areas. The knowledge orchard now uses the same life-area and sub-area catalog. Existing concept IDs, note references, sessions and links remain intact; legacy concepts are shown under “Choose a sub-area” until placed.

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

Browser tests use a local server with explicitly mocked authentication. No live account credentials or signup emails are used:

```sh
npx playwright install chromium
npm run dev:test
# In another terminal:
npm run test:browser
npm run test:goals
```

The fixture server uses port 5180. Set `ECHO_URL` for another server using the same mock configuration, and optionally `ECHO_BROWSER=msedge` to use an installed Microsoft Edge browser. Tests cover timer pause/reload recovery, session completion, overlap rejection, goal and concept creation, resource persistence, notes, reflections, PDF selection/highlighting/navigation, and mobile layout. Goal tests also cover legacy migration, two full goal chains in a custom area, renames, filtering, export/restore, and mobile layouts. Screenshots are written to the ignored `test-results/` directory.

## Deploy on Vercel

1. Import the GitHub repository **Astercodes/Echostudy** into Vercel.
2. Select the **Vite** framework preset.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Deploy. The included public Supabase configuration enables account access. If overriding it, set both variables described under Account access. Configure the production email redirect URLs in Supabase.

The checked-in `vercel.json` defines the build/output settings and SPA fallback. This repository does not create or use ChatGPT Sites infrastructure.

## Storage and current boundaries

This is a functional **single-device first version** with account-gated access. EchoStudy uses Supabase only for authentication; study data and uploaded files remain in the browser and are not cloud-synchronized. Each browser/origin has its own workspace. Preview URLs and production URLs have separate storage.

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

- `src/App.jsx`: navigation, planner, sessions, reflection, growth, and backup interface.
- `src/Goals.jsx` / `src/goals.css`: life-area management, goal editor, hierarchy and filters.
- `src/life-areas.js`: the supplied catalog, stable IDs, migration, and life-area validation.
- `src/model.js`: scheduling, goal ancestry/progress, timer accounting, gap rules, seed data, and backup validation.
- `src/Knowledge.jsx`: tree layout, concept editor, and growth suggestions.
- `src/Resources.jsx`: library, reader, highlighting, and permanent notes.
- `src/files.js`: IndexedDB file storage.
- `src/styles.css`: responsive citrus/green visual system.
- `src/pdf-text-layer.css`: PDF.js text-layer styles, under the upstream Apache 2.0 license notice.
- `tests/`: model and browser workflow checks.

A future synchronized edition can replace the persistence boundary with authenticated database/file storage while retaining the study, goal, and knowledge models.

## Knowledge orchard

Each life area has its own tree. Sub-areas form branches, concepts can grow smaller concept branches, and fruits hold text hidden from the canvas. Choose a life-area tree, select a sub-area and add a concept, then use **Grow a fruit**. Existing notes stay linked by their original concept IDs. Built-in legacy grouping nodes remain stored for backup compatibility.

- **Peel:** eight saved sections for foundations, prerequisites, definitions, mechanisms, components, assumptions, examples and advanced layers.
- **Squeeze:** eight deep-study sections for nuances, implications, debates, edge cases, relationships, evidence, questions and applications.
- **Taste:** editable questions and reference answers, concealed answers during recall, explicit self-assessment and timestamped attempt history. Starter prompts are templates, not AI-generated quizzes or automatic grades.
- **Apply:** saved application drafts and evidence/outcome records. Recording requires actual evidence and an outcome and marks the concept applied; it does not automatically complete goals or create Stretch/Barns credits.
- **Pluck:** preserves the idea's ID, content, history and grafts while making it an independent concept in its life-area tree.
- **Graft:** reciprocal links with a relationship and explanation, including between different life-area trees; neither primary home changes.
- **Isolate:** opens one idea with its content and investigation in an opaque focus view.
- **Compost:** archives an idea and its descendants without deleting notes, links or history; restore recovers the branch.

Learning edits save as you write. All these tools work without an AI provider. Like the rest of the workspace, knowledge is stored in this browser under the signed-in account; include it in JSON backups for transfer to another device.

Knowledge checks: `node --test tests/knowledge-tree.test.js`, `node tests/knowledge-tree-browser.cjs`, and `node tests/knowledge-actions-browser.cjs` (the browser tests use the local mock-auth fixture on port 5180).
