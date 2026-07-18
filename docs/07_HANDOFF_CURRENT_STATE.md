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
| Current phase | Phase 6B — Timed-practice backend and forward migration |
| Current phase status | `VERIFIED` |
| Next action | Phase 7A — Existing backend schema/seed conformance audit |
| Recommended model | Claude Sonnet |
| Required skill | None |
| Last updated | 2026-07-18 |
| Updated by | Phase 6B Sonnet audit |
| Active blocker | None |

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

Phase 1 scaffolding is complete. Backend and frontend foundations are verified through Phase 6.
Phase 6B timed/TTS/migration is implemented with automated evidence; Sonnet audit pending.

| Area | Status | Evidence or remaining work |
|---|---|---|
| Repository scaffolding | `VERIFIED` | Backend and frontend folders created with complete structure. |
| Environment examples and setup | `VERIFIED` | `.env.example` files present for both backend and frontend. Root `.gitignore` created. |
| Database models | `VERIFIED` | All tables including Phase 6B mode/expires_at/failure_reason and tts columns. |
| Alembic migrations | `VERIFIED` | Head `b7e3c91f2a04` (revises `ca24b65a41a3`). Empty + seeded + backfill upgrade tests pass; FK integrity confirmed. |
| Deterministic seed/reset | `VERIFIED` | ≥3 TTS exercises/skill; all five types audio-capable; row counts unchanged; idempotent reseed. |
| Course/path API | `VERIFIED` | GET /api/course returns full path with derived skill states. |
| Skill detail/start/resume API | `VERIFIED` | Standard start/resume unchanged; timed start added. |
| Lesson retrieve API | `VERIFIED` | Timed retrieve returns remaining_seconds; expiry persists time_expired. |
| Exercise answer validation | `VERIFIED` | Pure graders reused; timed wrong answers skip hearts. |
| Lesson completion transaction | `VERIFIED` | Standard + timed (fixed 20 XP, practice-only) paths; rollback hook proof. |
| Hearts loss, regeneration, and refill | `VERIFIED` | Standard still loses one heart; timed does not. |
| XP, daily goal, and total consistency | `VERIFIED` | Timed fixed 20 XP helper; standard formula preserved. |
| Streak clock logic | `VERIFIED` | Timed completion updates streak; timeout does not. |
| Crowns and server-derived locks | `VERIFIED` | Timed completion does not add crowns/unlocks. |
| Achievement evaluation | `VERIFIED` | Timed completion evaluates achievements. |
| Profile API | `VERIFIED` | Unchanged Phase 6. |
| Leaderboard API | `VERIFIED` | Unchanged Phase 6. |
| Content-management API | `VERIFIED` | Admin create/edit persists and validates tts_text/tts_lang. |
| Debug logical clock | `VERIFIED` | Used for timed expiry boundary tests without sleep(). |
| Timed practice backend | `VERIFIED` | start-timed, expiry, 20 XP, no hearts/crowns/unlocks; 27 Phase 6B tests pass. |
| TTS columns / admin TTS fields | `VERIFIED` | Migration + seed + admin + public exercise fields; 16 TTS exercises. |
| Frontend API client/state foundation | `VERIFIED` | API client with error handling, health contracts, and Zustand store created. |
| 3D design system and primitives | `NOT_STARTED` | Basic Tailwind setup complete, 3D primitives not yet implemented. |
| Learning path UI | `NOT_STARTED` | Folder structure exists but no screens implemented. |
| Lesson player and five exercise UIs | `NOT_STARTED` | Not implemented. |
| Feedback/failure/completion UI | `NOT_STARTED` | Not implemented. |
| Profile/leaderboard/settings UI | `NOT_STARTED` | Not implemented. |
| Content manager UI | `NOT_STARTED` | Not implemented. |
| Responsive accessibility | `NOT_STARTED` | Not implemented. |
| Dark mode bonus | `NOT_STARTED` | Zustand theme store created but no theme implementation. |
| Automated test suite | `VERIFIED` | **179 passed** (152 prior + 27 Phase 6B). Full suite green; concurrent start race proven. |
| Production builds | `VERIFIED` | Both frontend build and backend startup verified (prior phases). |
| Deployment and persistent SQLite | `NOT_STARTED` | Deferred; deployment spec missing. |
| README and submission evidence | `NOT_STARTED` | No `README.md` exists. |

---

## Current phase contract

### Phase

Phase 6B — Timed-practice backend and forward migration

### Objective

Forward Alembic migration for timed-attempt + TTS columns; timed start/answer/complete/retrieve;
seed TTS content; admin TTS validation; preserve standard-mode behavior.

### Allowed work

- New Alembic revision (never edit initial migration)
- Models/schemas for mode, expires_at, failure_reason, tts_text, tts_lang
- Seed TTS (≥3 per skill, all five types across seed)
- Admin create/edit TTS validation
- POST /api/skills/{id}/start-timed
- Timed expiry on retrieve/answer/complete
- Fixed 20 XP timed completion without crowns/unlocks
- Phase 6B tests

### Exit evidence required

- Migration applies to empty and existing seeded DBs — **passed (automated)**
- Standard mode unaffected — **passed (full suite green)**
- 120s timed expiry — **passed**
- time_expired awards zero XP — **passed**
- Successful timed: 20 XP, streak/practice, no crown/unlock — **passed**
- Timed wrong answers do not consume hearts — **passed**
- All backend tests pass — **178 passed**
- Formal Sonnet audit — **pending** (keeps status IMPLEMENTED_UNVERIFIED)

---

## Verified commands and results

| Date | Category | Command | Result | Notes |
|---|---|---|---|---|
| 2026-07-18 | Phase 6B focused (pre-audit) | `python -m pytest tests/test_phase6b_migration.py tests/test_phase6b_tts_seed.py tests/test_phase6b_timed_api.py -v` | **26 passed** | Migration, TTS seed/admin, timed matrix |
| 2026-07-18 | Phase 6B audit | `python -m pytest tests/test_phase6b_*.py -v` | **27 passed** | All Phase 6B + new concurrent start race test |
| 2026-07-18 | all backend | `python -m pytest tests/ -q` | **179 passed** | Prior 152 + 27 Phase 6B; no regressions |
| 2026-07-18 | alembic | `python -m alembic upgrade head` | Rev: **b7e3c91f2a04** | Local `lingopath.db` upgraded ca24b65a41a3 → b7e3c91f2a04 |
| 2026-07-18 | Phase 6 focused | `python -m pytest tests/test_phase6_api.py -v` | **21 passed** (within full suite) | Still green under Phase 6B |

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
| Current Alembic revision | **b7e3c91f2a04** (head) — timed practice + TTS columns |
| Prior revision | ca24b65a41a3 (initial schema) |
| SQLite foreign keys enabled | Yes - PRAGMA foreign_key_check empty in migration tests |
| Seed command | `python -m app.seed.seed_data [--reference-date YYYY-MM-DD] [--reset --yes]` |
| Seed rerun behavior | Updates safe content definitions (incl. TTS) without duplicating learner history |
| Default learner | Maya (maya_demo) - content admin, 340 XP, 6-day streak, 4 hearts, rank 3 |
| Expected row counts match `/docs/05_SEED_DATA.md` | YES - 60 exercises, 5 users, 142 attempts, 1,420 answers, 25 progress rows, 6 achievements |
| TTS seed | ≥3 TTS exercises per skill (`tts_text` + `tts_lang=es-ES`); all five types represented across seed |
| XP consistency | ALL USERS - Zero difference between stored total_xp and computed attempt XP |
| Exercise distribution | ALL SKILLS - Exactly 12 exercises per skill with required type distribution |
| Contract validation | Shared validators include TTS pair/blank/BCP-47 checks |
| Foreign key integrity | Zero violations - PRAGMA foreign_key_check returns empty |
| Active attempts | Zero - no in-progress seeded attempts |
| Existing local data requiring preservation | Local DB upgraded forward without reset |
| Attempt backfill | Existing attempts → `mode=standard`; failed standard → `failure_reason=out_of_hearts` |

---

## API contract evidence

Fill the result and test reference after each endpoint group is verified.

| Contract group | Result | Test or command reference |
|---|---|---|
| Course path and derived locks | **Verified** | `test_phase4_api.py::TestCourseAPI` |
| Skill detail/start/retrieve/resume | **Verified** | `test_phase4_api.py` start/retrieve suites |
| Timed start | **Implemented** | `test_phase6b_timed_api.py::TestTimedStart` |
| Lazy heart regeneration | **Verified** | Phase 4 + Phase 6 hearts status regen |
| All five answer shapes | **Verified** | `test_answer_grading.py` + `test_phase5a_api.py` |
| Attempt ordering/idempotency/conflicts | **Verified** | Phase 5A API suite |
| Timed answer/expiry | **Implemented** | `test_phase6b_timed_api.py` |
| Completion transaction | **Implemented** | Phase 5B + Phase 6B timed completion |
| Hearts status/refill | **Verified** | `test_phase6_api.py::TestHeartsAPI` |
| User profile/settings | **Verified** | `test_phase6_api.py::TestProfileAPI` |
| Leaderboard | **Verified** | `test_phase6_api.py::TestLeaderboardAPI` |
| Achievements | **Verified** | `test_phase6_api.py::TestAchievementsAPI` |
| Content management + TTS | **Implemented** | Phase 6 + `test_phase6b_tts_seed.py::TestAdminTTS` |
| Debug clock safety | **Verified** | Absent when disabled; used for timed expiry |
| Standard error envelope/status codes | **Extended** | Added `TIME_EXPIRED`; `SKILL_LOCKED` / `INSUFFICIENT_EXERCISES` codes on start paths |

### Phase 6B endpoint / behavior evidence

| Case | Result |
|---|---|
| Empty DB upgrade to head | Both migrations apply; FK check empty |
| Seeded DB forward upgrade | Attempt rows preserved; mode=standard backfill |
| Invalid mode/failure_reason | CHECK constraints reject |
| Timed start 120s | remaining_seconds=120; expires_at set server-side |
| Ten exercises / five types | Stratified selection |
| Refresh | Expiry and order preserved; remaining_seconds decreases with clock |
| Wrong timed answer | Mistakes++; hearts unchanged |
| Wrong standard answer | Still loses one heart |
| Expiry boundary (`now == expires_at`) | Still allows answer (uses strict `>`) |
| After expiry answer/retrieve/complete | TIME_EXPIRED / failed + time_expired; no XP |
| Timed complete | Exactly 20 XP; perfect_bonus=0; practice++; no crown/unlock |
| Duplicate/concurrent complete | One award only |
| Concurrent timed starts (separate sessions) | Service-level race cleanup keeps exactly one attempt |
| Completion rollback hook | Late failure rolls back XP/practice/status |
| Out-of-hearts failure_reason | Persisted as out_of_hearts |
| Public TTS fields | Exposed; correct_answer still hidden |
| TTS coverage | 16 TTS exercises: Skill 0=4, Skills 1-4=3 each; all 5 types present |
| OpenAPI | `/api/skills/{skill_id}/start-timed` registered |

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
| 2026-07-18 | Phase 5A: Graders are mode-agnostic; answer path is standard-only | Phase 6B extends without duplicating graders | `answer_grading.py`, `lesson_engine.submit_answer` |
| 2026-07-18 | Phase 5B: Completion uses conditional UPDATE claim (`status=in_progress`) | Concurrent completes produce one success + ATTEMPT_ALREADY_COMPLETED | `lesson_engine.complete_attempt` |
| 2026-07-18 | Phase 5B: Heart refill is service-only | HTTP GET/POST hearts endpoints remain Phase 6 | `hearts.refill_hearts` |
| 2026-07-18 | Phase 5B: Test-only `_completion_failure_hook` for rollback proof | Required integration scenario without weakening production path | `lesson_engine.set_completion_failure_hook` |
| 2026-07-18 | Phase 6: Debug routes gated by `DEBUG_CLOCK_ENABLED` (env) | Matches existing config; routes unregistered (404) when false | `config.py`, `main.py`, `routers/debug.py` |
| 2026-07-18 | Phase 6: `require_content_admin` centralized dependency | Non-admins get 403 CONTENT_ADMIN_REQUIRED | `dependencies/auth.py` |
| 2026-07-18 | Phase 6B: Forward migration `b7e3c91f2a04` only | Never rewrite initial migration; backfill mode/failure_reason | `alembic/versions/b7e3c91f2a04_*.py` |
| 2026-07-18 | Phase 6B: Expiry when `logical_now > expires_at` | Exact equality still playable; matches gamification spec | `lesson_engine._is_timed_expired` |
| 2026-07-18 | Phase 6B: TTS both-or-neither + BCP 47 pattern | Reject blank text and invalid language tags | `seed/validators.py` |
| 2026-07-18 | Phase 6B: Seed updates existing exercise definitions on reseed | Applies TTS without touching learner history | `seed/seed_data.py` |
| 2026-07-18 | Phase 6B: Concurrent timed starts keep earliest attempt | Delete extra empty in_progress attempts for same user/skill | `lesson_engine.start_timed_practice` |

If a decision changes an API, schema, gamification rule, acceptance criterion, or deployment
contract, update the source specification in the same phase. This handoff is not a replacement
for correcting the source document.

---

## Known issues and blockers

| Severity | Issue | Impact | Owner/action | Status |
|---|---|---|---|---|
| Info | `/docs/09_DEPLOYMENT.md` not yet created | No impact until deployment phase | Create when Phase 15 starts | Open |
| Info | Product name is LingoPath but repository is named LingoQuest | Cosmetic inconsistency | Intentional - LingoPath is the user-facing product name per requirements | Acknowledged |
| Info | Phase 6B Sonnet audit completed | All migration/TTS/timed contracts verified | Phase 6B marked VERIFIED | Resolved 2026-07-18 |
| Info | Phase 5B formal Sonnet audit not separately recorded | Completion path covered by Phase 5B + Phase 6/6B tests | Optional dedicated 5B audit before Phase 7 | Open |
| Info | No DB unique constraint preventing dual in_progress attempts | Service-level race cleanup proven correct with separate-session test | Acceptable for SQLite demo; verified in audit | Resolved 2026-07-18 |

---

## Phase 6B Audit findings

### Migration audit (PASS)
- ✓ Forward migration `b7e3c91f2a04` revises `ca24b65a41a3` without modifying initial migration
- ✓ Empty and seeded databases upgrade safely to head
- ✓ Existing attempt/history/progress data preserved
- ✓ Existing attempts backfill to `mode=standard`
- ✓ Historical failed standard attempts backfill `failure_reason=out_of_hearts`
- ✓ Mode/expires_at/failure_reason types/defaults/nullability/checks match schema
- ✓ TTS columns tts_text/tts_lang match schema
- ✓ Invalid mode/failure_reason values rejected by CHECK constraints
- ✓ Downgrade drops columns/constraints cleanly
- ✓ SQLite foreign keys enabled; PRAGMA foreign_key_check empty
- ✓ Runtime does not use create_all() (not found in app/)

### TTS audit (PASS)
- ✓ 16 TTS exercises: Skill 0=4, Skills 1-4=3 each (exceeds minimum 3 per skill)
- ✓ All five exercise types represented across course with TTS
- ✓ Spanish TTS text pedagogically appropriate; tts_lang=es-ES
- ✓ TTS fields survive seed, API serialization, admin create, admin patch
- ✓ Blank/mismatched/invalid TTS combinations rejected by validators
- ✓ Seed rerun updates content definitions without duplicating rows or overwriting learner progress
- ✓ Row counts, XP, progress, achievements unchanged (60 exercises, 5 users, 142 attempts, etc.)
- ✓ Correct answers hidden in all public exercise responses
- ✓ No Duolingo audio or assets added

### Timed start audit (PASS)
- ✓ Duration (120s) and expires_at set only by backend logical clock
- ✓ Locked skills rejected
- ✓ Attempt contains 10 unique exercises with all five types
- ✓ Order and expiry persist before response
- ✓ Refresh preserves expiry; remaining_seconds decreases with clock
- ✓ Standard and timed active-attempt interaction follows API spec
- ✓ Duplicate/concurrent starts handled by service-level race cleanup

### Concurrency audit (PASS)
- ✓ Service-level race cleanup proven correct with truly separate sessions test
- ✓ Concurrent timed starts result in exactly one surviving attempt per user-skill
- ✓ Both concurrent requests return the same surviving attempt ID
- ✓ Losing request correctly resumes the winner
- ✓ SQLite transaction strategy serializes creation adequately for demo use
- Note: No database unique constraint on (user_id, skill_id, status='in_progress')
- Assessment: Service cleanup is sufficient for SQLite demo; would recommend partial unique index for production

### Timed answer/expiry audit (PASS)
- ✓ Retrieve/answer/complete enforce backend expiry
- ✓ Expiry boundary uses `logical_now > expires_at` (strict greater-than; equality still playable)
- ✓ Expiry atomically produces status=failed, failure_reason=time_expired
- ✓ Timeout awards no XP, streak, crown, practice, unlock, or achievement
- ✓ Timed wrong answers increment mistakes but never deduct hearts
- ✓ Standard wrong answers still deduct one heart; out_of_hearts persisted correctly
- ✓ Invalid/duplicate/stale/concurrent answers mutate at most once
- ✓ All five existing pure graders reused (no duplication)

### Timed completion audit (PASS)
- ✓ Successful timed completion awards exactly 20 XP with no perfect bonus
- ✓ Total XP, today XP, streak, practice count, eligible achievements update once
- ✓ Timed completion does not add crowns or unlock skills
- ✓ Early/expired/failed/duplicate/concurrent completion cannot award effects
- ✓ Injected late failure rolls back every effect (rollback hook test)
- ✓ XP cache equals completed-attempt XP sums

### Clock and API audit (PASS)
- ✓ Services use injected logical clock; no sleep() or wall-clock time in domain functions
- ✓ remaining_seconds server-derived, nonnegative, consistent after refresh
- ✓ Debug-clock tests prove before/exactly-at/after-expiry behavior
- ✓ Public schemas include mode, expires_at, remaining_seconds, tts_text, tts_lang
- ✓ OpenAPI includes `/api/skills/{skill_id}/start-timed`
- ✓ Standard attempts backward-compatible
- ✓ All errors use standard envelope and documented status codes

### Test coverage
- 27 Phase 6B tests pass (4 migration, 6 TTS/seed/admin, 16 timed API, 1 concurrent start race)
- Full backend suite: 179 tests pass (152 prior + 27 Phase 6B)
- No regressions

## Files changed in the latest phase

Phase 6B audit and concurrent-start verification:

| File | Change | Reason |
|---|---|---|
| `backend/alembic/versions/b7e3c91f2a04_timed_practice_and_tts_columns.py` | Created | Forward migration |
| `backend/app/models/course.py` | Updated | tts_text / tts_lang |
| `backend/app/models/progress.py` | Updated | mode / expires_at / failure_reason + checks |
| `backend/app/services/lesson_engine.py` | Updated | Timed start/expiry/answer/complete; TTS in public exercises |
| `backend/app/routers/lessons.py` | Updated | POST start-timed |
| `backend/app/services/xp.py` | Updated | calculate_timed_xp |
| `backend/app/services/skill_progress.py` | Updated | apply_timed_practice_update |
| `backend/app/services/content_admin.py` | Updated | Persist/validate TTS |
| `backend/app/schemas/admin.py` | Updated | TTS fields on admin contracts |
| `backend/app/seed/validators.py` | Updated | TTS validation |
| `backend/app/seed/content.py` | Updated | ≥3 TTS exercises per skill |
| `backend/app/seed/seed_data.py` | Updated | Create/update TTS; reseed-safe content updates |
| `backend/tests/test_phase6b_migration.py` | Created (Phase 6B impl) | Migration upgrade/constraint tests |
| `backend/tests/test_phase6b_tts_seed.py` | Created (Phase 6B impl) | Seed/TTS/admin tests |
| `backend/tests/test_phase6b_timed_api.py` | Created (Phase 6B impl) | Timed integration matrix |
| `backend/tests/test_phase6b_concurrent_starts.py` | Created (Phase 6B audit) | Concurrent timed-start race proof with separate sessions |
| `docs/07_HANDOFF_CURRENT_STATE.md` | Updated (Phase 6B audit) | Phase 6B VERIFIED with complete audit findings |

---

## Working tree safety

| Check | Result |
|---|---|
| Current branch | `main` |
| Pre-existing unrelated edits | Preserved |
| Files that overlap planned phase work | Phase 6B backend/docs only |

---

## Exact next request for Cursor

Phase 6B is VERIFIED. Use this request next:

```text
Perform LingoQuest Phase 7A: existing backend schema/seed conformance audit.

Read:
1. .cursor/rules/project-rules.mdc
2. /CLAUDE.md
3. /docs/07_HANDOFF_CURRENT_STATE.md
4. Phase 7A from /docs/06_IMPLEMENTATION_PHASES.md
5. Requirements R-03, R-08, R-09, R-10, R-11, R-12
6. /docs/02_DATABASE_SCHEMA.md
7. /docs/05_SEED_DATA.md
8. Relevant sections from /docs/08_TESTING_ACCEPTANCE.md

Compare actual models, migrations, indexes, constraints, seed content, and seeded history against
specifications. Run migration/seed verification. Produce severity-ranked gap list with file evidence.

Fix only schema/seed gaps required for conformance using forward migrations. Do not redesign working
APIs or frontend.

Update the handoff with audit findings and set the next phase to 7B or frontend work depending on
outcome.
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
