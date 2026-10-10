# Knowledge Mastery Engine

Open **Knowledge Ecosystem → Knowledge Mastery**, or **Open Knowledge Mastery** in Study workspace.

This MVP accepts pasted source text, TXT and Markdown uploads, and text files from the Resource Library. Other library resources can be linked with a chapter, page or timestamp while the relevant passage is pasted. Documents are not silently truncated. The limit is 18,000 characters per source and 80 concepts per structure.

## Workflow

1. Create a structure from a source. AI analyzes the hierarchy; local mode preserves statements for manual structuring and uses a heuristic type suggestion.
2. Inspect original text next to the hierarchy. Edit labels, meaning, source quotations, parents, essential flags and exact terminology requirements. Add factual or mnemonic connections. Source quotations must match the original before practice begins.
3. Practise full reconstruction, categories, terminology, relationships, application or focused recall. Focused recall selects up to five weak or unreviewed concepts, then the earliest due concepts. It provides concept labels as cues; full reconstruction does not reveal the checklist.
4. Submit the hidden-source response. Gemini can assess meaning and accept valid paraphrases. Local review makes no automatic semantic accuracy claim: the learner reviews the checklist against the original. Both modes allow explicit learner corrections, recorded in history.
5. Save resolved judgments to schedule the next review. Uncertain judgments cannot silently receive a score. Incorrect, partial, qualifier-omitted, difficult or low-confidence items return sooner. Successful delayed practice increases spacing, capped at 60 days. Repeating a correct item on the same day does not expand its interval.

## AI configuration

Set `GEMINI_API_KEY` on Vercel, then redeploy. This is a server-only secret; never use a `VITE_` prefix. `GEMINI_MASTERY_MODEL` optionally overrides the default `gemini-2.5-flash`, documented by [Google](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash). The existing Supabase public project authenticates requests. The provider account needs an available model and quota.

`POST /api/knowledge-mastery` accepts `analyze` or `verify`. It authenticates the bearer token with Supabase, limits requests per authenticated user per server instance, imposes size limits/timeouts, validates source quotes, hierarchy cycles, response IDs and answer evidence, and returns generic provider errors without exposing credentials. The application sends source content only on explicit AI actions. API request payloads are not logged or stored by this handler; provider data handling still applies.

The in-memory limiter is a best-effort guard, not a distributed billing quota. Production cost limits should also be configured at the provider.

## Data and metrics

`masteryDecks` and `masteryInput` use the existing account-scoped browser workspace storage and JSON backup. The original source, Resource Library ID, reference, ecosystem node ID, draft answer, per-concept schedule and review history are preserved. This does not introduce cloud workspace sync. Uploaded source text is included in the backup; original resource files retain their existing device storage behavior.

Hierarchy edits reset current review scheduling and increment the checklist revision. Historical attempts keep their own checklist snapshot. Current metrics use the current revision, so editing a concept cannot confer an old score on new content. Mastery reviews do not automatically award Goals, BARNS, Study time or real-world capability credit.

Coverage is the percentage of assessed checklist items marked correct with no omitted qualifier. Terminology and relationship metrics come from their corresponding retrieval modes. Delayed recall requires at least 24 hours since the previous attempt in the same mode and checklist revision. A written application is shown as a scenario assessment, not demonstrated real-world performance. Missing evidence is shown as **Not assessed**.

AI semantic judgments remain reviewable; quotation validation proves provenance, not factual truth or exhaustive extraction. KPI targets in the product brief are not performance guarantees. Voice assessment, automatic PDF/OCR parsing, cross-subject discovery and AI-generated application scenarios are outside this MVP.

## Verification

Run `node --test tests/*.test.js`. With the mock-auth Vite server on port 5183, run `node tests/mastery-browser.cjs`. Browser tests simulate provider responses, including unavailable AI, and verify source concealment, persistent drafts, editable assessments, review scheduling and preserved ecosystem data. They do not establish a live provider's semantic accuracy.
