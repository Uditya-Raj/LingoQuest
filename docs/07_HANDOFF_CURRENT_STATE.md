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
| Current phase | Phase 5B — Completion and gamification |
| Current phase status | `IMPLEMENTED_UNVERIFIED` |
| Next action | Perform Sonnet audit of Phase 5B against exit checks, then mark VERIFIED if clean. |
| Recommended model | Claude Sonnet |
| Required skill | None for Phase 5B audit |
| Last updated | 2026-07-18 |
| Updated by | Phase 5B implementation (Cursor Auto) |
| Active blocker | None. Phase 5B implemented and locally tested; Sonnet audit still required before VERIFIED. |

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
| Lesson completion transaction | `IMPLEMENTED_UNVERIFIED` | POST /api/lessons/{attempt_id}/complete; Auto tests pass; Sonnet audit pending. |
| Hearts loss, regeneration, and refill | `IMPLEMENTED_UNVERIFIED` | Regen + loss (5A) + gem refill service (5B); HTTP refill route is Phase 6. |
| XP, daily goal, and total consistency | `IMPLEMENTED_UNVERIFIED` | Standard XP + perfect bonus + today XP + goal cap; cache invariant asserted in tests. |
| Streak clock logic | `VERIFIED` | Clock abstraction + streak service with same/next/missed/longest/clock-conflict. |
| Crowns and server-derived locks | `IMPLEMENTED_UNVERIFIED` | Crown/practice + unlock transitions in skill_progress; path derivation reused. |
| Achievement evaluation | `IMPLEMENTED_UNVERIFIED` | All four criteria types; unique-constraint idempotency; newly unlocked only. |
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
| Automated test suite | `IMPLEMENTED_UNVERIFIED` | **131 passed** after Phase 5B (prior 95 + 36 Phase 5B). Sonnet audit pending. |
| Production builds | `VERIFIED` | Both frontend build and backend startup verified. |
| Deployment and persistent SQLite | `NOT_STARTED` | Deferred; deployment spec missing. |
| README and submission evidence | `NOT_STARTED` | No `README.md` exists. |

---

## Current phase contract

### Phase

Phase 5B — Completion and gamification

### Objective

Implement atomic standard-mode lesson completion and gamification services.

### Allowed work

- POST /api/lessons/{attempt_id}/complete
- XP, daily goal, streak, crowns/unlocks, achievements services
- Heart refill service (HTTP route deferred to Phase 6)
- Unit matrix + integration scenarios
- Handoff update; status IMPLEMENTED_UNVERIFIED until Sonnet audit

### Exit evidence required

- Gamification unit-test matrix passes
- Early, failed, and duplicate completion conflict without effects
- Successful completion updates all state atomically
- Concurrent completion mutates once; rollback restores prior state
- Profile/path/leaderboard sources agree after refresh
- 20-gem refill works; failed refill spends nothing
- Sonnet audit before VERIFIED (pending)

---

## Verified commands and results

| Date | Category | Command | Result | Notes |
|---|---|---|---|---|
| 2026-07-18 | Phase 5B focused | `python -m pytest tests/test_gamification_unit.py tests/test_phase5b_api.py -v` | **36 passed** | Unit matrix + 13 integration scenarios |
| 2026-07-18 | all backend | `python -m pytest tests/ -q` | **131 passed** | Prior 95 + 36 Phase 5B; no regressions |
| 2026-07-18 | alembic | (unchanged) | Rev: ca24b65a41a3 (head) | Initial migration not edited; timed columns staged for 6B |

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
| Current Alembic revision | ca24b65a41a3 (head) - initial schema; **no Phase 5B migration** |
| SQLite foreign keys enabled | Yes - verified via PRAGMA test and event listener in `database.py` |
| Seed command | `python -m app.seed.seed_data [--reference-date YYYY-MM-DD] [--reset --yes]` |
| Seed rerun behavior | Idempotent - detects existing Maya history and skips, no duplicates |
| Default learner | Maya (maya_demo) - content admin, 340 XP, 6-day streak, 4 hearts, rank 3 |
| Expected row counts match `/docs/05_SEED_DATA.md` | YES - 60 exercises, 5 users, 142 attempts, 1,420 answers, 25 progress rows (5 per user), 6 achievements |
| XP consistency | ALL USERS - Zero difference between stored total_xp and computed attempt XP (asserted after every Phase 5B completion scenario) |
| Exercise distribution | ALL SKILLS - Exactly 12 exercises per skill with required type distribution (3 MC, 2 WB, 2 MP, 2 FB, 3 TA) |
| Contract validation | Zero invalid exercise contracts - all 60 pass shared validators |
| Foreign key integrity | Zero violations - PRAGMA foreign_key_check returns empty |
| Active attempts | Zero - no in-progress seeded attempts |
| Existing local data requiring preservation | None - fresh repository |
| Staged schema (Phase 6B) | `mode`, `expires_at`, `failure_reason` not yet on `lesson_attempts`; standard completion only |

---

## API contract evidence

Fill the result and test reference after each endpoint group is verified.

| Contract group | Result | Test or command reference |
|---|---|---|
| Course path and derived locks | **Verified** | `test_phase4_api.py::TestCourseAPI` |
| Skill detail/start/retrieve/resume | **Verified** | `test_phase4_api.py` start/retrieve suites |
| Lazy heart regeneration | **Verified** | `test_phase4_api.py::TestHeartRegeneration` |
| All five answer shapes | **Verified** | `test_answer_grading.py` + `test_phase5a_api.py` |
| Attempt ordering/idempotency/conflicts | **Verified** | Phase 5A API suite |
| Completion transaction | **Implemented (audit pending)** | `test_phase5b_api.py` — early/failed/perfect/duplicate/concurrent/rollback |
| Hearts status/refill | **Service only** | `test_gamification_unit.py::TestHeartRefill`; HTTP route Phase 6 |
| User profile/settings | Not verified | — |
| Leaderboard | Not verified | — |
| Achievements | **Service + completion response** | Unit + `test_achievement_threshold_crossed_by_completion` |
| Content management | Not verified | — |
| Debug clock safety | Not verified | — |
| Standard error envelope/status codes | **Extended** | LESSON_NOT_READY, ATTEMPT_ALREADY_COMPLETED, ATTEMPT_FAILED, OUT_OF_HEARTS, CLOCK_BEFORE_ACTIVITY, HEARTS_ALREADY_FULL, INSUFFICIENT_GEMS, REFILL_NOT_CONFIRMED |

### Phase 5B atomicity / concurrency evidence

| Case | Result |
|---|---|
| Early complete | 409 LESSON_NOT_READY; no XP/streak/crown change |
| Failed complete | 409 ATTEMPT_FAILED; no effects |
| Non-perfect complete | 10 XP; crown +1; streak rules applied |
| Perfect complete | 15 XP (base 10 + floor bonus 5) |
| Duplicate complete | 409 ATTEMPT_ALREADY_COMPLETED; no second effects |
| Concurrent complete | One `ok` + one `ATTEMPT_ALREADY_COMPLETED`; XP awarded once |
| Injected late-step failure | Full rollback; retry succeeds once |
| Same/next/skipped logical dates | extended_today false / increment / reset to 1 |
| Crown cap + unlock | Replay at max caps crowns; Family→Questions unlock returned |
| Achievement threshold | Current completion can unlock (e.g. streak_7) |
| XP cache invariant | `users.total_xp == SUM(completed xp_earned)` after every scenario |
| Completion OpenAPI | `CompletionResponse` registered; path `/api/lessons/{attempt_id}/complete` |

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
| 2026-07-18 | Phase 5B marked IMPLEMENTED_UNVERIFIED | Cursor Auto implemented; Sonnet audit required before VERIFIED | handoff |

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
| Info | Phase 5B Sonnet audit pending | Status remains IMPLEMENTED_UNVERIFIED | Run Sonnet audit against exit checks | Open |

---

## Files changed in the latest phase

Phase 5B implemented atomic standard-mode completion and gamification services:

| File | Change | Reason |
|---|---|---|
| `backend/app/services/xp.py` | Created | Standard XP, today XP, daily-goal progress, XP sum invariant helper |
| `backend/app/services/streak.py` | Created | Logical-date streak transitions + CLOCK_BEFORE_ACTIVITY |
| `backend/app/services/skill_progress.py` | Created | Crown/practice updates + newly unlocked skill IDs |
| `backend/app/services/achievements.py` | Created | Criteria evaluation + idempotent awards |
| `backend/app/services/hearts.py` | Updated | `refill_hearts` with confirm/regen/full/gems rules |
| `backend/app/services/lesson_engine.py` | Updated | `complete_attempt` orchestration + failure hook |
| `backend/app/services/course_path.py` | Updated | Delegate today XP to `xp.py` |
| `backend/app/schemas/lesson.py` | Updated | `CompletionResponse` and nested models |
| `backend/app/routers/lessons.py` | Updated | Thin POST `/lessons/{attempt_id}/complete` |
| `backend/tests/test_gamification_unit.py` | Created | Phase 5B unit matrix |
| `backend/tests/test_phase5b_api.py` | Created | Phase 5B integration scenarios |
| `docs/07_HANDOFF_CURRENT_STATE.md` | Updated | Phase 5B IMPLEMENTED_UNVERIFIED evidence |

---

## Working tree safety

| Check | Result |
|---|---|
| Current branch | `main` |
| Pre-existing unrelated edits | Preserved; Phase 5B touched listed backend/docs files only |
| Files that overlap planned phase work | None beyond Phase 5B scope |

---

## Exact next request for Cursor

Phase 5B is implemented but not yet Sonnet-audited. Use this request next:

```text
Perform LingoQuest Phase 5B Sonnet audit from /docs/06_IMPLEMENTATION_PHASES.md using Claude Sonnet.

Read these first:
1. .cursor/rules/project-rules.mdc
2. /CLAUDE.md
3. /docs/07_HANDOFF_CURRENT_STATE.md
4. The Phase 5B section of /docs/06_IMPLEMENTATION_PHASES.md
5. Completion contracts in /docs/03_API_SPEC.md and /docs/04_GAMIFICATION_LOGIC.md

Audit the Auto implementation against every Phase 5B exit check and the gamification unit/
integration matrix. Re-run focused and full backend tests. Fix any gaps. If clean, mark Phase 5B
VERIFIED in the handoff and set the next action to Phase 6. Stop after the audit.
```

After Phase 5B is VERIFIED, Phase 6 is next (remaining backend endpoints). Phase 6B remains
staged for timed-practice columns and behavior.

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
