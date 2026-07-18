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
| Current phase | Phase 6 — Remaining backend endpoints |
| Current phase status | `VERIFIED` |
| Next action | Perform Phase 6B: timed-practice backend + forward migration (mode/expires_at/failure_reason + TTS columns). |
| Recommended model | Claude Sonnet (or Cursor Auto for routine work) |
| Required skill | None for Phase 6B |
| Last updated | 2026-07-18 |
| Updated by | Phase 6 implementation (Cursor Auto) |
| Active blocker | None. Phase 6 standard endpoints verified. TTS admin persistence and timed practice staged for 6B. |

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
| `.claude/skills/frontend-design/SKILL.md` | Visual, 3D primitives, motion skill | **Present** |

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
| Exercise answer validation | `VERIFIED` | Pure graders for all five types; POST /api/lessons/{attempt_id}/answer with audit rows. |
| Lesson completion transaction | `IMPLEMENTED_UNVERIFIED` | Phase 5B complete path; Phase 6 regression smoke passed; dedicated Sonnet 5B audit still optional. |
| Hearts loss, regeneration, and refill | `VERIFIED` | GET /api/hearts/status + POST /api/hearts/refill reuse Phase 5B service; Phase 6 tests pass. |
| XP, daily goal, and total consistency | `IMPLEMENTED_UNVERIFIED` | Used by profile/completion; Phase 6 profile goal-edit tests pass. |
| Streak clock logic | `VERIFIED` | Clock abstraction + streak service; debug clock drives streak/daily XP in Phase 6 tests. |
| Crowns and server-derived locks | `IMPLEMENTED_UNVERIFIED` | Still via Phase 5B completion; path derivation unchanged. |
| Achievement evaluation | `VERIFIED` | GET /api/achievements + completion awards; earned persists below later thresholds. |
| Profile API | `VERIFIED` | GET/PATCH /api/user/me with real aggregates and goal recompute. |
| Leaderboard API | `VERIFIED` | GET /api/leaderboard; Maya rank 3; updates after completion. |
| Content-management API | `VERIFIED` | Tree + create/edit for all five types; merged patch; active-attempt protection. |
| Debug logical clock | `VERIFIED` | Routes present only when `DEBUG_CLOCK_ENABLED=true`; absent (404) otherwise. |
| Timed practice backend | `NOT_STARTED` | Staged for Phase 6B. |
| TTS columns / admin TTS fields | `NOT_STARTED` | Staged for Phase 6B (no migration rewrite in Phase 6). |
| Frontend API client/state foundation | `VERIFIED` | API client with error handling, health contracts, and Zustand store created. |
| 3D design system and primitives | `NOT_STARTED` | Basic Tailwind setup complete, 3D primitives not yet implemented. |
| Learning path UI | `NOT_STARTED` | Folder structure exists but no screens implemented. |
| Lesson player and five exercise UIs | `NOT_STARTED` | Not implemented. |
| Feedback/failure/completion UI | `NOT_STARTED` | Not implemented. |
| Profile/leaderboard/settings UI | `NOT_STARTED` | Not implemented. |
| Content manager UI | `NOT_STARTED` | Not implemented. |
| Responsive accessibility | `NOT_STARTED` | Not implemented. |
| Dark mode bonus | `NOT_STARTED` | Zustand theme store created but no theme implementation. |
| Automated test suite | `VERIFIED` | **152 passed** after Phase 6 (prior 131 + 21 Phase 6). |
| Production builds | `VERIFIED` | Both frontend build and backend startup verified. |
| Deployment and persistent SQLite | `NOT_STARTED` | Deferred; deployment spec missing. |
| README and submission evidence | `NOT_STARTED` | No `README.md` exists. |

---

## Current phase contract

### Phase

Phase 6 — Remaining backend endpoints

### Objective

Implement remaining standard backend endpoints: hearts HTTP, profile/settings, leaderboard,
achievements list, content admin, and development-only debug clock.

### Allowed work

- GET/POST hearts status and refill
- GET/PATCH /api/user/me
- GET /api/leaderboard
- GET /api/achievements
- Admin content tree + exercise create/edit
- Debug clock routes when enabled
- Phase 6 API tests and full suite

### Exit evidence required

- Every endpoint matches API spec / OpenAPI models — **passed**
- Daily goal edit persists and recomputes progress — **passed**
- Maya is rank three; current user always returned — **passed**
- Admin create/edit validates all five types — **passed**
- Debug endpoints absent unless enabled — **passed**
- No placeholder 501 endpoints — **passed**

---

## Verified commands and results

| Date | Category | Command | Result | Notes |
|---|---|---|---|---|
| 2026-07-18 | Phase 6 focused | `python -m pytest tests/test_phase6_api.py -v` | **21 passed** | Hearts, profile, leaderboard, achievements, admin, debug, OpenAPI |
| 2026-07-18 | all backend | `python -m pytest tests/ -q` | **152 passed** | Prior 131 + 21 Phase 6; no regressions |
| 2026-07-18 | Phase 5B focused | `python -m pytest tests/test_gamification_unit.py tests/test_phase5b_api.py -v` | **36 passed** | Still green under Phase 6 suite |
| 2026-07-18 | alembic | (unchanged) | Rev: ca24b65a41a3 (head) | No Phase 6 migration; TTS/timed columns staged for 6B |

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
| Current Alembic revision | ca24b65a41a3 (head) - initial schema; **no Phase 6 migration** |
| SQLite foreign keys enabled | Yes - verified via PRAGMA test and event listener in `database.py` |
| Seed command | `python -m app.seed.seed_data [--reference-date YYYY-MM-DD] [--reset --yes]` |
| Seed rerun behavior | Idempotent - detects existing Maya history and skips, no duplicates |
| Default learner | Maya (maya_demo) - content admin, 340 XP, 6-day streak, 4 hearts, rank 3 |
| Expected row counts match `/docs/05_SEED_DATA.md` | YES - 60 exercises, 5 users, 142 attempts, 1,420 answers, 25 progress rows (5 per user), 6 achievements |
| XP consistency | ALL USERS - Zero difference between stored total_xp and computed attempt XP |
| Exercise distribution | ALL SKILLS - Exactly 12 exercises per skill with required type distribution |
| Contract validation | Zero invalid exercise contracts - all 60 pass shared validators |
| Foreign key integrity | Zero violations - PRAGMA foreign_key_check returns empty |
| Active attempts | Zero - no in-progress seeded attempts |
| Existing local data requiring preservation | None - fresh repository |
| Staged schema (Phase 6B) | `lesson_attempts.mode`, `expires_at`, `failure_reason`; `exercises.tts_text`, `exercises.tts_lang` |

---

## API contract evidence

Fill the result and test reference after each endpoint group is verified.

| Contract group | Result | Test or command reference |
|---|---|---|
| Course path and derived locks | **Verified** | `test_phase4_api.py::TestCourseAPI` |
| Skill detail/start/retrieve/resume | **Verified** | `test_phase4_api.py` start/retrieve suites |
| Lazy heart regeneration | **Verified** | Phase 4 + Phase 6 hearts status regen |
| All five answer shapes | **Verified** | `test_answer_grading.py` + `test_phase5a_api.py` |
| Attempt ordering/idempotency/conflicts | **Verified** | Phase 5A API suite |
| Completion transaction | **Implemented** | `test_phase5b_api.py`; Phase 6 regression smoke |
| Hearts status/refill | **Verified** | `test_phase6_api.py::TestHeartsAPI` |
| User profile/settings | **Verified** | `test_phase6_api.py::TestProfileAPI` |
| Leaderboard | **Verified** | `test_phase6_api.py::TestLeaderboardAPI` |
| Achievements | **Verified** | `test_phase6_api.py::TestAchievementsAPI` |
| Content management | **Verified** | `test_phase6_api.py::TestContentAdminAPI` |
| Debug clock safety | **Verified** | Absent when disabled; read/advance/reset when enabled |
| Standard error envelope/status codes | **Extended** | CONTENT_ADMIN_REQUIRED, HEARTS_ALREADY_FULL, INSUFFICIENT_GEMS, REFILL_NOT_CONFIRMED, INVALID_EXERCISE_CONTRACT, CONTENT_IN_ACTIVE_ATTEMPT |

### Phase 6 endpoint evidence

| Case | Result |
|---|---|
| Heart status full/partial/regen | Exact next_heart_at, seconds_until_next, interval 15 |
| Refill success | Spends 20 gems; fills hearts; clears anchor |
| Refill failures | Full / unconfirmed / insufficient spend nothing |
| Maya profile | 340 XP, today 10, goal 0.5, streak 6/11, 2 skills, 29 lessons, 10 perfect |
| PATCH display_name + daily_goal | Persists; progress recomputed; XP unchanged |
| Invalid/empty/unknown patch | 422 |
| Leaderboard order | Leo #1 … Maya #3; ranking_basis=total_xp |
| Leaderboard limit=2 | current_user still Maya rank 3 |
| Leaderboard after complete | Maya XP increases |
| Achievements | streak_7 earned with current_value 6; xp_500 locked at 340 |
| Non-admin content | 403 CONTENT_ADMIN_REQUIRED |
| Admin tree | Ordered course/unit/skill/lesson/exercises with correct_answer |
| Create all five types | 201 each |
| Invalid contract | 400; no persistence |
| Merged patch | Invalid type-only rejected; valid prompt patch OK |
| Active-attempt edit | 409 CONTENT_IN_ACTIVE_ATTEMPT |
| Debug disabled | /api/debug/clock → 404; absent from OpenAPI |
| Debug enabled | read/advance/reset + clock-driven hearts/streak/daily XP |
| OpenAPI models | Hearts/Profile/Leaderboard/Achievements/Admin/Completion registered |

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
| 2026-07-18 | Phase 5A: Graders are mode-agnostic; answer path is standard-only | Phase 6B will add timed expiry / no-heart rules without duplicating graders | `answer_grading.py`, `lesson_engine.submit_answer` |
| 2026-07-18 | Phase 5A: Zero-heart failure does not persist `failure_reason` yet | Column arrives in Phase 6B forward migration; status+completed_at still stamped | `lesson_engine.py`, handoff staging note |
| 2026-07-18 | Phase 5B: Completion uses conditional UPDATE claim (`status=in_progress`) | Concurrent completes produce one success + ATTEMPT_ALREADY_COMPLETED | `lesson_engine.complete_attempt` |
| 2026-07-18 | Phase 5B: Standard XP helper only; timed fixed-20 deferred | Phase 6B extends without duplicating streak/achievement rules | `xp.py`, `lesson_engine.complete_attempt` |
| 2026-07-18 | Phase 5B: Heart refill is service-only | HTTP GET/POST hearts endpoints remain Phase 6 | `hearts.refill_hearts` |
| 2026-07-18 | Phase 5B: Test-only `_completion_failure_hook` for rollback proof | Required integration scenario without weakening production path | `lesson_engine.set_completion_failure_hook` |
| 2026-07-18 | Phase 6: Debug routes gated by `DEBUG_CLOCK_ENABLED` (env) | Matches existing config; routes unregistered (404) when false | `config.py`, `main.py`, `routers/debug.py` |
| 2026-07-18 | Phase 6: TTS fields not persisted; admin uses existing columns only | Forward migration for tts_text/tts_lang deferred to Phase 6B | `content_admin.py`, handoff staging |
| 2026-07-18 | Phase 6: `require_content_admin` centralized dependency | Non-admins get 403 CONTENT_ADMIN_REQUIRED | `dependencies/auth.py` |

If a decision changes an API, schema, gamification rule, acceptance criterion, or deployment
contract, update the source specification in the same phase. This handoff is not a replacement
for correcting the source document.

---

## Known issues and blockers

| Severity | Issue | Impact | Owner/action | Status |
|---|---|---|---|---|
| Info | `/docs/09_DEPLOYMENT.md` not yet created | No impact until deployment phase | Create when Phase 15 starts | Open |
| Info | Product name is LingoPath but repository is named LingoQuest | Cosmetic inconsistency | Intentional - LingoPath is the user-facing product name per requirements | Acknowledged |
| Info | Timed practice + `failure_reason` / `mode` / `expires_at` columns staged | Standard completion only; Phase 6B adds timed start/answer/complete | Phase 6B forward migration | Open (by design) |
| Info | `exercises.tts_text` / `tts_lang` not yet in schema | Admin create/edit cannot persist TTS until 6B; seed TTS later | Phase 6B: add columns, seed ≥3 TTS exercises/skill, extend admin validation | Open (by design) |
| Info | Phase 5B formal Sonnet audit not separately recorded | Completion path covered by Phase 5B + Phase 6 regression tests | Optional dedicated 5B audit before Phase 7 | Open |

---

## Files changed in the latest phase

Phase 6 implemented remaining standard backend endpoints:

| File | Change | Reason |
|---|---|---|
| `backend/app/schemas/hearts.py` | Created | Hearts status/refill contracts |
| `backend/app/schemas/user.py` | Created | Profile + PATCH contracts |
| `backend/app/schemas/leaderboard.py` | Created | Leaderboard contracts |
| `backend/app/schemas/achievements.py` | Created | Achievements list contracts |
| `backend/app/schemas/admin.py` | Created | Content tree + exercise admin contracts |
| `backend/app/schemas/debug.py` | Created | Debug clock contracts |
| `backend/app/services/profile.py` | Created | Profile aggregates + settings patch |
| `backend/app/services/leaderboard.py` | Created | Deterministic total-XP ranking |
| `backend/app/services/content_admin.py` | Created | Tree, create, merged-patch edit, active-attempt guard |
| `backend/app/services/achievements.py` | Updated | `list_achievements_for_user` read path |
| `backend/app/services/hearts.py` | Updated | `HeartsStatus` + ceil seconds_until_next |
| `backend/app/core/clock.py` | Updated | DebugClock day offset + advance/reset |
| `backend/app/dependencies/auth.py` | Updated | `require_content_admin` |
| `backend/app/routers/hearts.py` | Created | GET status, POST refill |
| `backend/app/routers/user.py` | Created | GET/PATCH user/me |
| `backend/app/routers/leaderboard.py` | Created | GET leaderboard |
| `backend/app/routers/achievements.py` | Created | GET achievements |
| `backend/app/routers/admin.py` | Created | Content tree + exercise create/edit |
| `backend/app/routers/debug.py` | Created | Debug clock routes |
| `backend/app/main.py` | Updated | Register Phase 6 routers; conditional debug |
| `backend/tests/test_phase6_api.py` | Created | Phase 6 integration matrix (21 tests) |
| `docs/07_HANDOFF_CURRENT_STATE.md` | Updated | Phase 6 VERIFIED evidence |

---

## Working tree safety

| Check | Result |
|---|---|
| Current branch | `main` |
| Pre-existing unrelated edits | Preserved; Phase 5B uncommitted files remain alongside Phase 6 additions |
| Files that overlap planned phase work | Phase 5B + Phase 6 backend/docs only |

---

## Exact next request for Cursor

Phase 6 is VERIFIED. Use this request next:

```text
Perform LingoQuest Phase 6B from /docs/06_IMPLEMENTATION_PHASES.md using Claude Sonnet
(or Cursor Auto if preferred for routine migration work).

Read these first:
1. .cursor/rules/project-rules.mdc
2. /CLAUDE.md
3. /docs/07_HANDOFF_CURRENT_STATE.md
4. The Phase 6B section of /docs/06_IMPLEMENTATION_PHASES.md
5. Timed-practice rules in /docs/04_GAMIFICATION_LOGIC.md and /docs/03_API_SPEC.md
6. Schema notes for lesson_attempts mode/expires_at/failure_reason and exercises tts_text/tts_lang

Implement the forward Alembic migration and timed-practice backend. Also add TTS columns,
seed at least three TTS exercises per skill, and extend admin create/edit validation for TTS.
Preserve standard-mode behavior. Stop after Phase 6B.
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
