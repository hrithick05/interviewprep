# Legacy Django audit

The Django application (`main/`, `interview_prep/`) is **already absent from the working tree**. This audit is from git history (`HEAD` at the time of the TypeScript rewrite) plus recoverable fixture files.

**Choice:** Django stays **deleted** (not moved to `/legacy`). Recovering a second runtime would reintroduce unsafe code execution, SQLite, and a competing architecture. Fixtures are imported through `scripts/import-legacy.ts` into Supabase.

## Models

| Model | Decision | Notes |
| --- | --- | --- |
| `CodingQuestion` | PORT content / REDESIGN schema | Title, difficulty, description, sample I/O → `coding_problems` + `coding_test_cases`. |
| `Submission` | REDESIGN | Becomes `coding_submissions` + per-case results. |
| `Question` | PORT content / REDESIGN schema | `field`/`category` map to `topics` + `question_type`. Options and explanations preserved. |
| `InterviewSubmission` | DROP | One row per answer with 0/1 score. Replaced by `attempts` / `attempt_answers`. |
| `HRAnswer` | REDESIGN | Free-text STAR answers live in `hr_answers` with versions. |
| Django `User` | DROP | Replaced by Supabase Auth + `user_profiles`. |

## Views and features

| Feature | Decision | Rationale |
| --- | --- | --- |
| MCQ mock interview | REDESIGN (already started) | Server-side attempts, timed tests, bookmarks. |
| Preference taxonomy | PORT concept | HR / Technical / Aptitude plus named topics. |
| HR free-text + 60s timer + speech | REDESIGN | STAR editor, optional speech, no shared MCQ model. |
| Coding list/detail | REDESIGN | Monaco + Judge0/MockRunner. **DROP** `temp.py` + `subprocess`. |
| Resume templates 1–4 + ReportLab PDF | REDESIGN | Structured JSON resumes, live preview, print/PDF with selectable text. |
| Admin user list / per-user stats | REDESIGN | RLS + admin middleware, analytics, bulk import. |
| Django admin / auth / signup | DROP | Supabase Auth. |
| Session `completed` coding flags | DROP | Never written by views. |
| `get_feedback`, unused login view, orphan templates | DROP | Dead code. |
| Badges / streaks / company tracks | DROP (nothing to port) | Built net-new in Phase 4. |

## Scoring

Legacy MCQ: **+1 if option text matches `correct_answer`, else 0**. Skip does not change score. **No negative marking.**

New scoring lives in `@prepforge/shared` (`scoreQuestionSet`) with configurable negative marking, computed **server-side only**.

## Fixtures

| File | Decision |
| --- | --- |
| `questions.json` / `clean_questions.json` | PORT 12 coding prompts (dedupe titles, synthesize I/O where empty). |
| `full_backup.json` | PORT extracted `main.question` rows only. File is corrupt JSON; importer salvage-parses objects. |
| `db.sqlite3` | DROP (never committed). |

## Security debt not carried forward

- `@csrf_exempt` code runner executing user Python on the app server
- Shared `temp.py` race
- Superuser HTML admin without RLS
