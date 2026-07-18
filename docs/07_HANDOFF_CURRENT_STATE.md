# LingoQuest — Current State and Session Handoff

## Purpose

This is the only document that records what is currently implemented. Specifications describe
what LingoQuest must become; this file describes what the repository actually contains today.

Claude must read this file immediately after `.cursor/rules/project-rules.mdc` at the beginning
of every Cursor session. Do not infer implementation status from phase prompts, old chat messages,
README claims, filenames, or generated code that has not been run.

Update this file at the end of every implementation or verification phase. Keep it concise,
factual, and based on evidence.

---

## Status legend

Use only these values:

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No relevant implementation has been verified. |
| `PARTIAL` | Some scope exists, but required behavior or verification is incomplete. |
| `BLOCKED` | Work cannot continue without a decision, credential, dependency, or safe migration. |
| `IMPLEMENTED_UNVERIFIED` | Code exists, but its required checks have not passed in this repository. |
| `VERIFIED` | Required checks passed and the evidence is recorded below. |
| `REGRESSION` | Previously verified behavior is currently broken. |

`IMPLEMENTED_UNVERIFIED` is not equivalent to complete. A phase can be marked `VERIFIED` only
when its exit checks in `/docs/06_IMPLEMENTATION_PHASES.md` pass.

---

## Snapshot

| Field | Current value |
|---|---|
| Product | LingoPath (repository: LingoQuest) |
| Repository state | `INSPECTED` |
| Current phase | Phase 4 — Course, skill, start, and retrieve APIs |
| Current phase status | `VERIFIED` |
| Next action | Perform Phase 5A — Exercise grading and answer transaction. |
| Recommended model | Claude Sonnet |
| Required skill | None for Phase 5A |
| Last updated | 2026-07-18 |
| Updated by | Phase 4 implementation |
| Active blocker | None. Phase 4 complete with all endpoints passing tests. |

---

## Specification package status

This table tracks whether the planning files are present, not whether the app is implemented.

| File | Purpose | Presence |
|---|---|---|
| `/docs/00_REQUIREMENTS_TRACEABILITY.md` | Assignment requirement-to-evidence map | **Present** |
| `/docs/00_MASTER_PLAN.md` | Scope, build strategy, and document map | **Present** |
| `/docs/01_ARCHITECTURE.md` | Stack, boundaries, structure, and design decisions | **Present** |
| `/docs/02_DATABASE_SCHEMA.md` | Relational schema, constraints, indexes, and migrations | **Present** |
| `/docs/03_API_SPEC.md` | Endpoint and exercise contracts | **Present** |
| `/docs/04_GAMIFICATION_LOGIC.md` | Hearts, XP, streak, crowns, goals, and achievements | **Present** |
| `/docs/05_SEED_DATA.md` | Deterministic demo content and expected row counts | **Present** |
| `/docs/06_IMPLEMENTATION_PHASES.md` | Model-routed Cursor tasks and exit gates | **Present** |
| `/docs/07_HANDOFF_CURRENT_STATE.md` | Current verified implementation state | **Present** |
| `/docs/08_TESTING_ACCEPTANCE.md` | Automated and manual acceptance matrix | **Present** |
| `/docs/09_DEPLOYMENT.md` | Hosting, persistence, environment, and smoke tests | **Missing** - to be created when deployment phase starts |
| `.cursor/rules/project-rules.mdc` | Always-on Cursor project rules | **Present** |
| `/CLAUDE.md` | Optional Claude Code entry point; not a substitute for Cursor rules | **Present** |
| `.claude/skills/ui-ux-pro-max/SKILL.md` | UX hierarchy, responsive, accessibility skill | **Present** |
| `.claude/skills/frontend-design/SKILL.md` | Visual design, 3D primitives, motion skill | **Present** |

---

## Implementation status

Phase 1 scaffolding is complete. Backend and frontend foundations are verified.

| Area | Status | Evidence or remaining work |
|---|---|---|
| Repository scaffolding | `VERIFIED` | Backend and frontend folders created with complete structure. |
| Environment examples and setup | `VERIFIED` | `.env.example` files present for both backend and frontend. Root `.gitignore` created. |
| Database models | `VERIFIED` | All 11 tables implemented with SQLAlchemy 2.0 typed models split by domain. |
| Alembic migrations | `VERIFIED` | Initial migration ca24b65a41a3 generated and applied successfully. |
| Deterministic seed/reset | `VERIFIED` | Complete seed system with 60 exercises, 5 users, 142 attempts, 1,420 answers, 25 progress rows (5 per user). |
| Course/path API | `VERIFIED` | GET /api/course returns full path with derived skill states, all four states present. |
| Skill detail/start/resume API | `VERIFIED` | GET /api/skills/{id}, POST /api/skills/{id}/start working with resume logic. |
| Lesson retrieve API | `VERIFIED` | GET /api/lessons/{attempt_id} retrieves persisted attempts correctly. |
| Exercise answer validation | `NOT_STARTED` | Not implemented. |
| Lesson completion transaction | `NOT_STARTED` | Not implemented. |
| Hearts loss, regeneration, and refill | `PARTIAL` | Lazy regeneration implemented and tested; loss and refill not yet implemented. |
| XP, daily goal, and total consistency | `NOT_STARTED` | Not implemented. |
| Streak clock logic | `VERIFIED` | Clock abstraction implemented with real and debug clocks, logical_date() added. |
| Crowns and server-derived locks | `VERIFIED` | Skill state derivation working, crowns tracked in progress. |
| Achievement evaluation | `NOT_STARTED` | Not implemented. |
| Profile API | `NOT_STARTED` | Not implemented. |
| Leaderboard API | `NOT_STARTED` | Not implemented. |
| Content-management API | `NOT_STARTED` | Not implemented. |
| Frontend API client/state foundation | `VERIFIED` | API client with error handling, health contracts, and Zustand store created. |
| 3D design system and primitives | `NOT_STARTED` | Basic Tailwind setup complete, 3D primitives not yet implemented. |
| Learning path UI | `NOT_STARTED` | Folder structure exists but no screens implemented. |
| Lesson player and five exercise UIs | `NOT_STARTED` | Not implemented. |
| Feedback/failure/completion UI | `NOT_STARTED` | Not implemented. |
| Profile/leaderboard/settings UI | `NOT_STARTED` | Not implemented. |
| Content manager UI | `NOT_STARTED` | Not implemented. |
| Responsive accessibility | `NOT_STARTED` | Not implemented. |
| Dark mode bonus | `NOT_STARTED` | Zustand theme store created but no theme implementation. |
| Automated test suite | `VERIFIED` | 49 tests pass: 2 health + 21 schema + 7 seed + 19 Phase 4 API tests. |
| Production builds | `VERIFIED` | Both frontend build and backend startup verified. |
| Deployment and persistent SQLite | `NOT_STARTED` | Deferred; deployment spec missing. |
| README and submission evidence | `NOT_STARTED` | No `README.md` exists. |

---

## Current phase contract

### Phase

Phase 3B — Reconcile specifications with final HR assignment

### Objective

Update all specification documents to add audio and timed practice as required features. This is a
documentation-only phase with no application code or migration implementation.

### Allowed work

- Update database schema specification to add new fields
- Update requirements traceability to move audio and timed practice from deferred to required
- Update API specification to add audio fields and timed practice endpoints
- Update gamification logic for timed-mode rules
- Update seed specification for TTS requirements
- Update implementation phases to insert new phases 6B, 10D, 10E
- Update testing acceptance to add audio and timed practice test cases
- Update CLAUDE.md and project-rules.mdc
- Make toasts and mascot flourishes explicit in requirements
- Search for contradictions

### Exit evidence required

- All specification documents consistently reflect audio as required (R-13)
- All specification documents consistently reflect timed practice as required (R-14)
- R-15 through R-17 renumbered correctly
- Deferred scope explicitly excludes speech recognition (not playback TTS)
- No contradictory references remain
- Phase 4 remains the next implementation phase
- No application code or migrations changed

---

## Verified commands and results

| Date | Category | Command | Result | Notes |
|---|---|---|---|---|
| 2026-07-18 | git status | `git status` | On branch `main`, no commits yet, only untracked files (`.claude/`, `.cursor/`, `docs/`, `CLAUDE.md`) | Clean repository with specifications only |
| 2026-07-18 | structure | `Get-ChildItem -Name` | Lists: `.claude`, `.cursor`, `docs`, `CLAUDE.md` | No backend or frontend folders |
| 2026-07-18 | backend check | `Test-Path backend` | False | Backend folder does not exist |
| 2026-07-18 | frontend check | `Test-Path frontend` | False | Frontend folder does not exist |
| 2026-07-18 | skills check | `Test-Path .claude\skills\*\SKILL.md` | Both skills present | `ui-ux-pro-max` and `frontend-design` verified |
| 2026-07-18 | rules check | `Test-Path .cursor\rules\project-rules.mdc` | True | Project rules file verified |
| 2026-07-18 | backend install | `pip install -r backend/requirements.txt` | Exit 0 | All dependencies installed successfully |
| 2026-07-18 | backend imports | `python -c "from app.main import app..."` | Success | All core modules import correctly |
| 2026-07-18 | backend tests | `pytest -v` in backend/ | 2 passed | Health and readiness tests pass |
| 2026-07-18 | backend boot | `uvicorn app.main:app` | Started successfully | Server running on http://127.0.0.1:8000 |
| 2026-07-18 | health endpoint | `curl http://127.0.0.1:8000/api/health` | `{"status":"healthy"}` | Health check works |
| 2026-07-18 | ready endpoint | `curl http://127.0.0.1:8000/api/ready` | `{"status":"ready","database":"connected"}` | Readiness with DB check works |
| 2026-07-18 | frontend install | `npm install` in frontend/ | Exit 0 | 361 packages installed |
| 2026-07-18 | frontend typecheck | `npm run typecheck` | Exit 0 | No TypeScript errors |
| 2026-07-18 | frontend lint | `npm run lint` | Exit 0 | No ESLint errors |
| 2026-07-18 | frontend build | `npm run build` | Exit 0 | Production build successful, 4 pages generated |
| 2026-07-18 | frontend dev | `npm run dev` | Started successfully | Dev server running on http://localhost:3000 |
| 2026-07-18 | git tracking | `git status --porcelain` | Only new untracked folders | No .env, node_modules, or build output tracked |
| 2026-07-18 | alembic upgrade | `alembic upgrade head` | Exit 0 | Migration applied successfully to empty database |
| 2026-07-18 | alembic current | `alembic current -v` | Rev: ca24b65a41a3 (head) | Migration at expected revision |
| 2026-07-18 | schema tests | `pytest tests/test_schema.py -v` | 21 passed | All constraint, foreign key, and relationship tests pass |
| 2026-07-18 | all backend tests | `pytest -v` | 23 passed (2 health + 21 schema) | Complete test suite passes |
| 2026-07-18 | seed with reset | `python -m app.seed.seed_data --reset --yes --reference-date 2026-07-18` | Exit 0 | Created 60 exercises, 5 users, 142 attempts, 1,420 answers, 25 progress rows, all checks passed |
| 2026-07-18 | seed idempotency | `python -m app.seed.seed_data --reference-date 2026-07-18` | Exit 0 | No duplicates created, skipped history, 25 progress rows unchanged |
| 2026-07-18 | all backend tests | `python -m pytest tests/ -v` | 30 passed | 2 health + 21 schema + 7 seed integration tests all pass |
| 2026-07-18 | Phase 4 tests | `python -m pytest tests/test_phase4_api.py -v` | 19 passed | All Phase 4 API integration tests pass |
| 2026-07-18 | all backend tests | `python -m pytest tests/ -v` | 49 passed | 2 health + 21 schema + 7 seed + 19 Phase 4 API tests all pass |
| 2026-07-18 | backend server | `uvicorn app.main:app` | Started successfully | Server running with new Phase 4 endpoints |

---

## Manual verification evidence

For visual or interactive phases, record the viewport and exact flow exercised.

| Date | Screen/flow | Viewport | Result | Evidence/notes |
|---|---|---|---|---|
| — | — | — | Not run | No manual flow has been verified. |

Minimum final flows are defined in `/docs/08_TESTING_ACCEPTANCE.md`. A page merely rendering is
not sufficient evidence for its buttons, persistence, errors, or responsive behavior.

---

## Database and seed evidence

| Item | Verified value |
|---|---|
| Database engine/path | SQLite at `./lingopath.db` |
| Current Alembic revision | ca24b65a41a3 (head) - initial schema with all tables constraints and indexes |
| SQLite foreign keys enabled | Yes - verified via PRAGMA test and event listener in `database.py` |
| Seed command | `python -m app.seed.seed_data [--reference-date YYYY-MM-DD] [--reset --yes]` |
| Seed rerun behavior | Idempotent - detects existing Maya history and skips, no duplicates |
| Default learner | Maya (maya_demo) - content admin, 340 XP, 6-day streak, 4 hearts, rank 3 |
| Expected row counts match `/docs/05_SEED_DATA.md` | YES - 60 exercises, 5 users, 142 attempts, 1,420 answers, 25 progress rows (5 per user), 6 achievements |
| XP consistency | ALL USERS - Zero difference between stored total_xp and computed attempt XP |
| Exercise distribution | ALL SKILLS - Exactly 12 exercises per skill with required type distribution (3 MC, 2 WB, 2 MP, 2 FB, 3 TA) |
| Contract validation | Zero invalid exercise contracts - all 60 pass shared validators |
| Foreign key integrity | Zero violations - PRAGMA foreign_key_check returns empty |
| Active attempts | Zero - no in-progress seeded attempts |
| Existing local data requiring preservation | None - fresh repository |

---

## API contract evidence

Fill the result and test reference after each endpoint group is verified.

| Contract group | Result | Test or command reference |
|---|---|---|
| Course path and derived locks | **Verified** | `test_phase4_api.py::TestCourseAPI` - all 4 tests pass |
| Skill detail/start/retrieve/resume | **Verified** | `test_phase4_api.py::TestSkillDetailAPI`, `TestLessonStartAPI`, `TestLessonRetrieveAPI` - 13 tests pass |
| Lazy heart regeneration | **Verified** | `test_phase4_api.py::TestHeartRegeneration` - 2 tests pass |
| All five answer shapes | Not verified | — |
| Attempt ordering/idempotency/conflicts | Not verified | — |
| Completion transaction | Not verified | — |
| Hearts status/refill | Not verified | — |
| User profile/settings | Not verified | — |
| Leaderboard | Not verified | — |
| Achievements | Not verified | — |
| Content management | Not verified | — |
| Debug clock safety | Not verified | — |
| Standard error envelope/status codes | **Verified** | Phase 4 tests confirm 404, 409 errors use standard envelope |

---

## Frontend evidence

Do not begin visual polish until the dependent API contracts are verified. When frontend work
starts, use only the two installed project skills:

```text
.claude/skills/ui-ux-pro-max/SKILL.md
.claude/skills/frontend-design/SKILL.md
```

If either path is missing, record a blocker and continue only with work that does not depend on
that skill. Do not substitute or reference invented skills.

| Frontend area | Functional evidence | Visual evidence | Result |
|---|---|---|---|
| Shared API/error/session handling | — | Not applicable | Not verified |
| 3D primitives/design tokens | — | Required at target viewports | Not verified |
| Learning path | — | Required at desktop/mobile | Not verified |
| Lesson player | — | Required at desktop/mobile | Not verified |
| Profile | — | Required | Not verified |
| Leaderboard | — | Required | Not verified |
| Settings/daily goal | — | Required | Not verified |
| Content manager | — | Required | Not verified |
| Empty/loading/error states | — | Required | Not verified |
| Keyboard/focus/reduced motion | — | Required | Not verified |
| Dark mode | — | Required only if implemented | Not verified |

Visual quality must be evaluated from running screenshots, not inferred from component source.

---

## Decisions made during implementation

Specifications already contain planned architecture decisions. Record only new repository-level
decisions or approved deviations discovered while implementing.

| Date | Decision | Reason | Affected files/specs |
|---|---|---|---|
| 2026-07-18 | Use `exercise_metadata` Python attribute mapped to `metadata` column | `metadata` is reserved in SQLAlchemy Declarative API | `backend/app/models/course.py` (Exercise model) |
| 2026-07-18 | Remove cascade="all, delete-orphan" from RESTRICT foreign keys | SQLAlchemy cascade would bypass database RESTRICT constraints | All model relationship definitions |
| 2026-07-18 | Phase 3B: Audio and timed practice moved from deferred to required | Final HR assignment labels all bonus items as required | All specification documents, R-13 through R-17 renumbered |
| 2026-07-18 | Phase 3B: Exercise audio uses browser Speech Synthesis TTS | Zero-cost TTS via speechSynthesis API; audio_url for future original audio | Schema, API, seed, requirements, testing |
| 2026-07-18 | Phase 3B: Timed practice is 120-second challenge mode | Backend expires_at enforcement; fixed 20 XP; no hearts consumed; no crowns/unlocks | Schema, API, gamification, requirements, phases, testing |
| 2026-07-18 | Phase 3B: Toasts and mascot flourishes made explicit in R-16 | Visual requirements previously implicit now documented | Requirements R-16 acceptance criteria |
| 2026-07-18 | Phase 4: Use simplified get_current_user() returning Maya | Authentication simplified for demo; proper user-scoped queries preserved | `backend/app/dependencies/auth.py` |
| 2026-07-18 | Phase 4: SQLite datetimes may be timezone-naive | Added `ensure_utc_aware()` helper to handle both naive and aware datetimes | `backend/app/services/hearts.py` |
| 2026-07-18 | Phase 4: Standard error envelope with code/message/details | All domain errors use structured envelope per API spec | `backend/app/core/errors.py`, all routers |
| 2026-07-18 | Phase 4: Standard-mode attempt response includes timed-practice defaults | mode=standard, expires_at=null, remaining_seconds=null; timed implementation deferred to Phase 6B | `backend/app/schemas/lesson.py`, services |

If a decision changes an API, schema, gamification rule, acceptance criterion, or deployment
contract, update the source specification in the same phase. This handoff is not a replacement
for correcting the source document.

---

## Known issues and blockers

| Severity | Issue | Impact | Owner/action | Status |
|---|---|---|---|---|
| Info | `/docs/09_DEPLOYMENT.md` not yet created | No impact until deployment phase | Create when Phase 15 starts | Open |
| Info | Product name is LingoPath but repository is named LingoQuest | Cosmetic inconsistency | Intentional - LingoPath is the user-facing product name per requirements | Acknowledged |

---

## Files changed in the latest phase

Phase 4 implemented course, skill, start, and retrieve APIs:

| File | Change | Reason |
|---|---|---|
| `backend/app/dependencies/auth.py` | Created | Simplified get_current_user() dependency returning seeded Maya |
| `backend/app/schemas/common.py` | Created | LearnerSummary and error response schemas |
| `backend/app/schemas/course.py` | Created | Course path, skill detail, and public exercise response schemas |
| `backend/app/schemas/lesson.py` | Created | Lesson attempt response schemas for start/retrieve |
| `backend/app/services/hearts.py` | Created | Lazy heart regeneration with timezone-aware datetime handling |
| `backend/app/services/course_path.py` | Created | Skill state derivation and course/skill detail services |
| `backend/app/services/lesson_engine.py` | Created | Stratified exercise selection, start/resume, and retrieve logic |
| `backend/app/routers/course.py` | Created | GET /api/course and GET /api/skills/{id} endpoints |
| `backend/app/routers/lessons.py` | Created | POST /api/skills/{id}/start and GET /api/lessons/{id} endpoints |
| `backend/app/core/errors.py` | Updated | Enhanced error classes with code/message/details for standard envelope |
| `backend/app/core/clock.py` | Updated | Added logical_date() method to Clock protocol and implementations |
| `backend/app/main.py` | Updated | Registered course and lessons routers |
| `backend/tests/conftest.py` | Updated | Added seeded_session and async_client fixtures with seeded data |
| `backend/tests/test_phase4_api.py` | Created | 19 integration tests covering all Phase 4 requirements |

---

## Working tree safety

Phase 0 has verified the repository state:

| Check | Result |
|---|---|
| Current branch | `main` |
| Git status | No commits yet; only untracked specification/documentation files |
| Pre-existing modified files | None |
| Pre-existing untracked files | `.claude/`, `.cursor/`, `docs/`, `CLAUDE.md` (all preserved) |
| Files that overlap planned phase work | None - no implementation exists to overlap |

---

## Exact next request for Cursor

Phase 4 is complete. Use this request to begin Phase 5A:

```text
Perform LingoQuest Phase 5A from /docs/06_IMPLEMENTATION_PHASES.md using Claude Sonnet.

Read these first:
1. .cursor/rules/project-rules.mdc
2. /CLAUDE.md
3. /docs/07_HANDOFF_CURRENT_STATE.md
4. The Phase 5A section of /docs/06_IMPLEMENTATION_PHASES.md
5. /docs/02_DATABASE_SCHEMA.md — attempts and answer audit
6. /docs/03_API_SPEC.md — Public exercise contracts and Answer endpoint
7. /docs/04_GAMIFICATION_LOGIC.md — Exercise grading, Answer transaction, Hearts, Failure

Implement pure validated graders for all five types and the atomic answer service/route. Enforce owned in-progress attempt, expected position/exercise, duplicate protection, answer audit snapshots, current-index advancement, lazy regeneration, single-heart loss, and immediate zero-heart failure.

Run Phase 5A exit checks and update the handoff. Stop after Phase 5A.
```

---

## End-of-phase update checklist

Before ending any Cursor phase, update all applicable items:

- Snapshot: phase, status, next action, model, skill, date, blocker.
- Implementation status rows affected by the phase.
- Commands with concise results and exit codes/test counts.
- Manual flows and viewports actually exercised.
- Database/API/frontend evidence relevant to the phase.
- New decisions and specification corrections.
- Known issues with severity and action.
- Files changed in the phase.
- Working-tree overlap or preservation notes.
- Exact next Cursor request.

Then give the user a short phase report containing:

1. Outcome.
2. Files changed.
3. Verification performed and results.
4. Remaining blockers or risks.
5. Exact next phase and recommended model/skill.

Do not paste this entire handoff into chat. Keep the authoritative current state in this file.

---

## Maintenance rules

- Replace stale facts; do not append endless session diaries.
- Preserve only the latest useful command evidence plus unresolved historical issues.
- Use ISO dates (`YYYY-MM-DD`) once the file is initialized.
- Never record secrets, tokens, private URLs, `.env` values, or personal data.
- Never claim a hosted URL, passing test, deployed revision, or completed feature without evidence.
- If the handoff conflicts with verified code, update the handoff.
- If code conflicts with a source specification, report the conflict before changing behavior.
- Keep `SUBMISSION READY` out of this file until Phase 16 has passed every required check.