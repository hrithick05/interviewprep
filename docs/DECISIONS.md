# Product and engineering decisions

Defaults chosen so work can continue without blocking. Revisit only when a real constraint appears.

## Architecture

1. **Single system:** TypeScript client + Express API + Supabase. Django is deleted, not archived, because a second stack would fight migrations, CI, and onboarding.
2. **Profiles table name:** Physical table remains `user_profiles` (already migrated and used by the client). It is the spec's `profiles` table: trigger on `auth.users`, role protection, text size, theme, font, XP, streak. A `profiles` view is provided for readability.
3. **Roles:** Keep existing `'USER' | 'ADMIN'` check values for compatibility. `is_admin()` treats `ADMIN` as admin.
4. **Question answers:** Authenticated clients never `SELECT` `correct_answer` or `explanation`. The API omits them for in-progress timed tests and list endpoints. Practice mode returns feedback only after an answer is saved.
5. **Hidden tests:** `coding_test_cases` where `visibility = 'hidden'` has **no client SELECT policy**. The API never returns input/output for hidden cases—only pass/fail, time, and memory after submit.
6. **Code execution:** Never on the app server. `CODE_RUNNER=mock|judge0`. MockRunner is deterministic for local/dev/tests.
7. **AI:** `AI_PROVIDER=mock|anthropic|grok|groq`. Missing keys → mock + warning in development; fail fast in production if a non-mock provider is selected without a key. User text is treated as data in system prompts.
8. **Resume PDF:** Browser print stylesheet (selectable text). No third-party PDF SaaS.
9. **Readiness score:** Weighted formula in `docs/READINESS.md`, unit-tested in shared.
10. **Seed:** Idempotent SQL plus `scripts/seed.ts`. Legacy importer merges Django fixtures without duplicating prompts.
11. **Negative marking:** Off by default; timed tests may enable `negativeMarking` (wrong answers subtract `wrongPenalty`, default 0.25). Unanswered is 0.
12. **Text size:** `LARGE` = 100% root (body 1.25rem), `EXTRA_LARGE` = 112.5%, `HUGE` = 125%. Applied in `index.html` before paint from `localStorage`.
13. **Health:** `/health` and `/api/v1/health` both return the same envelope so Render and local docs agree.
