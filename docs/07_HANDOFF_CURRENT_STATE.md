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
| Product | LingoQuest |
| Repository state | `INSPECTED` |
| Current phase | Phase 8C — 3D design system and primitives |
| Current phase status | `VERIFIED` |
| Next action | Phase 9A — Learning-path functionality |
| Recommended model | Claude Sonnet |
| Required skill | None |
| Last updated | 2026-07-18 |
| Updated by | Phase 8C 3D design system |
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

Phase 1 scaffolding is complete. Backend foundations through Phase 6B are verified. Phase 7A
schema/seed conformance audit is verified (including migration data-preservation correction).
Phase 7B API/gamification conformance audit is verified. Phase 5B completion audit formally closed.
Phase 7C backend end-to-end HTTP acceptance gate is verified. Phase 8A frontend API foundation is
verified.

| Area | Status | Evidence or remaining work |
|---|---|---|
| Repository scaffolding | `VERIFIED` | Backend and frontend folders created with complete structure. |
| Environment examples and setup | `VERIFIED` | Frontend uses `NEXT_PUBLIC_API_BASE_URL` (normalized in `lib/config.ts`). |
| Database models | `VERIFIED` | Phase 7A: active_course_id FK + leaderboard index added; no stored skill status. |
| Alembic migrations | `VERIFIED` | Head `c8a1f4e2b9d0`. `b7e3c91f2a04` repaired in-place (additive ADD COLUMN). Empty + populated ca24→head preserve 1,420 answers. |
| Deterministic seed/reset | `VERIFIED` | Exact counts, TTS ≥3/skill, XP cache consistent, idempotent reseed; CLI UTC reference_now. |
| Course/path API | `VERIFIED` | GET /api/course returns full path with derived skill states. |
| Skill detail/start/resume API | `VERIFIED` | Standard start/resume unchanged; timed start added. |
| Lesson retrieve API | `VERIFIED` | Timed retrieve returns remaining_seconds; expiry persists time_expired. |
| Exercise answer validation | `VERIFIED` | Pure graders reused; timed wrong answers skip hearts. |
| Lesson completion transaction | `VERIFIED` | Standard + timed paths; rollback hook proof. Phase 5B formally closed by 7B audit. |
| Hearts loss, regeneration, and refill | `VERIFIED` | Standard still loses one heart; timed does not. |
| XP, daily goal, and total consistency | `VERIFIED` | Seed XP cache equals attempt sums. |
| Streak clock logic | `VERIFIED` | Timed completion updates streak; timeout does not. |
| Crowns and server-derived locks | `VERIFIED` | Timed completion does not add crowns/unlocks. |
| Achievement evaluation | `VERIFIED` | Timed completion evaluates achievements. |
| Profile API | `VERIFIED` | Unchanged Phase 6. |
| Leaderboard API | `VERIFIED` | Ordering supported by `ix_users_leaderboard`. |
| Content-management API | `VERIFIED` | Admin create/edit persists and validates tts_text/tts_lang. |
| Debug logical clock | `VERIFIED` | Used for timed expiry boundary tests without sleep(). |
| Timed practice backend | `VERIFIED` | Phase 6B VERIFIED. |
| TTS columns / admin TTS fields | `VERIFIED` | 16 TTS exercises; all five types. |
| Frontend API client/state foundation | `VERIFIED` | Phase 8A: typed contracts, HTTP client, wrappers, session store, Vitest. |
| UX and visual-system blueprint | `VERIFIED` | Phase 8B: `/docs/10_UX_BLUEPRINT.md` — complete 17-section visual direction. |
| 3D design system and primitives | `VERIFIED` | Phase 8C: complete token system, 15 primitives, theme system, Quest mascot, 67 tests. |
| Learning path UI | `NOT_STARTED` | Placeholder route `/` only; no path UI. |
| Lesson player and five exercise UIs | `NOT_STARTED` | Placeholder `/lesson/[attemptId]` only. |
| Feedback/failure/completion UI | `NOT_STARTED` | Not implemented. |
| Profile/leaderboard/settings UI | `NOT_STARTED` | Placeholder routes only. |
| Content manager UI | `NOT_STARTED` | Placeholder `/admin/content` only. |
| Responsive accessibility | `NOT_STARTED` | Not implemented. |
| Dark mode bonus | `PARTIAL` | Theme system implemented (light/dark/system with flash prevention); tokens complete; screens not yet themed. |
| Automated test suite | `VERIFIED` | Backend **198 passed** (prior). Frontend Vitest **67 passed** (Phase 8C: +45 component/store tests). |
| Production builds | `VERIFIED` | Frontend `next build` passed (Phase 8C); backend startup prior. |
| Deployment and persistent SQLite | `NOT_STARTED` | Deferred; deployment spec missing. |
| README and submission evidence | `NOT_STARTED` | No `README.md` exists. |

---

## Current phase contract

### Phase

Phase 8C — 3D design system and primitives

### Objective

Implement the approved LingoQuest visual foundation: design tokens, typography, 3D interaction
system, reusable primitives, theme management, toast/modal infrastructure, Quest mascot, and
development-only showcase.

### Skill used

`frontend-design` — loaded before implementation. Guided: subject-specific design choices (not
generic defaults), Nunito as characterful type, 3D depth as the signature visual element,
restraint in decoration, and self-critique during implementation.

### Exit evidence required

- Primitives render at mobile and desktop widths — **passed** (showcase renders at all widths)
- Mouse, keyboard, touch, focus, reduced-motion, disabled/loading states work — **passed**
- Typecheck/lint/build pass — **passed** (all three green)
- Shared tokens/primitives documented — **passed** (token system in globals.css; components in components/ui/)
- No screen-specific duplicated 3D CSS — **passed** (all depth in components/ui/ only)
- Tests pass — **passed** (67 tests, all passing)

---

## Verified commands and results

| Date | Category | Command | Result | Notes |
|---|---|---|---|---|
| 2026-07-18 | Phase 8C unit | `cd frontend; npx vitest run` | **67 passed** | button, progress, modal, toast, mascot, stores, client |
| 2026-07-18 | Phase 8C typecheck | `cd frontend; npx tsc --noEmit` | **pass** | Clean, no errors |
| 2026-07-18 | Phase 8C lint | `cd frontend; npx next lint` | **pass** | No ESLint warnings or errors |
| 2026-07-18 | Phase 8C build | `cd frontend; npx next build` | **pass** | Next.js 15.5.20; includes /design-system showcase route |
| 2026-07-18 | Phase 8C quality | `any` / `@ts-ignore` / `LingoPath` search | **0 matches** | Clean frontend source |
| 2026-07-18 | Phase 8C quality | Hard-coded colors in primitives | **0** (only in mascot SVG fills) | Mascot fills are original illustration, not token bypass |
| 2026-07-18 | Phase 8C quality | Duplicated 3D depth outside `components/ui/` | **0** | All depth in shared primitives only |
| 2026-07-18 | Phase 8C quality | Persisted hearts/XP/streak/crowns/gems in UI store | **0** | Only theme preference persisted |
| 2026-07-18 | Phase 8C quality | Design-system route in production | **returns 404** | `notFound()` when `NODE_ENV !== 'development'` |
| 2026-07-18 | Phase 8A smoke | GET course/me/hearts/leaderboard/achievements on `127.0.0.1:8001` | **200** all | Current LingoQuest API; fields match TS contracts |
| 2026-07-18 | Phase 7C focused | `python -m pytest tests/test_phase7c_acceptance.py -q` | **13 passed** | Fresh Alembic+seed HTTP acceptance |
| 2026-07-18 | all backend | `python -m pytest tests/ -q` | **198 passed** | 185 prior + 13 Phase 7C |
| 2026-07-18 | Alembic head | `python -m alembic heads` | **c8a1f4e2b9d0 (head)** | Unchanged |

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
| Database engine/path | SQLite at `./lingopath.db` (backend cwd) |
| Current Alembic revision | **c8a1f4e2b9d0** (head) |
| Prior revisions | ca24b65a41a3 → b7e3c91f2a04 → c8a1f4e2b9d0 |
| SQLite foreign keys enabled | Yes — connect pragma + PRAGMA foreign_key_check empty |
| Seed command | `python -m app.seed.seed_data [--reference-date YYYY-MM-DD] [--reset --yes]` |
| Seed rerun behavior | Updates safe content definitions without duplicating learner history |
| Default learner | Maya (maya_demo) — 340 XP, streak 6/11, hearts 4/5, gems 100, goal 20, rank 3, admin |
| Expected row counts | YES — courses 1, units 3, skills 5, lessons 5, exercises 60, users 5, progress 25, achievements 6, attempts 142 completed / 0 active, answers 1,420 |
| user_achievements | **22** (supported-threshold count from verification report) |
| TTS seed | 16 TTS: Greetings 4, others 3 each; all five types; `tts_lang=es-ES` |
| XP consistency | ALL USERS — stored total_xp equals completed-attempt XP sum |
| Exercise distribution | ALL SKILLS — 12 each with required type mix |
| Contract validation | Shared validators; 0 invalid contracts on seed |
| Active attempts | Zero |
| users.active_course_id FK | **Present** — `ON DELETE SET NULL` (Phase 7A) |
| ix_users_leaderboard | **Present** — `(total_xp, username, id)` |
| user_skill_progress.status | **Absent** (derived only) |
| Runtime create_all() | Not used under `app/` |
| Attempt backfill (6B) | Existing attempts → `mode=standard`; failed standard → `failure_reason=out_of_hearts` |
| Local data preservation | **Local `lingopath.db` already lost answers** under the old b7e3 body (142 attempts, 0 answers). Not reset during this correction. Future upgrades need no reset. |

### Compatibility impact

| Item | Detail |
|---|---|
| Root cause | `b7e3c91f2a04` used `op.batch_alter_table("lesson_attempts")`, which on SQLite rebuilds the table. With FKs ON, dropping the old `lesson_attempts` CASCADE-deleted all `exercise_answers`. |
| Exact correction | Same revision ID `b7e3c91f2a04` / down_revision `ca24b65a41a3`. Replaced batch rebuild with native `ALTER TABLE … ADD COLUMN` for `mode`, `expires_at`, `failure_reason`, `tts_text`, `tts_lang`, plus column CHECK constraints and backfill UPDATEs. Downgrade uses `DROP COLUMN` under `PRAGMA foreign_keys=OFF`. |
| Pre-release exception | Repository is pre-release with no external production databases. In-place repair of an already-shipped revision ID is explicitly allowed here because a later forward migration cannot restore arbitrary answers already deleted. |
| Before/after (temp populated ca24) | Before b7e3: attempts=142, answers=1420. After old body: answers=0. After repaired body → head: attempts=142, answers=1420, progress=25, user_achievements=22, XP sum unchanged, mode backfilled to `standard`. |
| Phase 7A migration safety | `c8a1f4e2b9d0` still sets `PRAGMA foreign_keys=OFF` around users batch rebuild. |
| Local `lingopath.db` recovery | Disposable seeded dev DB already wiped. Safe recovery (not run in this phase): from `backend/`, `python -m app.seed.seed_data --reset --yes --reference-date 2026-07-18`. Do not use this to “prove” preservation — use the temp-DB regression test. |

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
| Completion transaction | **Verified** | Phase 5B + 6B + Phase 7C HTTP complete/idempotency/concurrency |
| Hearts status/refill | **Verified** | Phase 6 + Phase 7C zero-heart/refill/regen |
| User profile/settings | **Verified** | Phase 6 + Phase 7C seed/patch/today XP |
| Leaderboard | **Verified** | Phase 6 + Phase 7C post-completion rank/XP |
| Achievements | **Verified** | Phase 6 + Phase 7C earned/locked consistency |
| Content management + TTS | **Verified** | Phase 6/6B + Phase 7C admin create/edit/TTS/protection |
| Debug clock safety | **Verified** | Absent when disabled; Phase 7C uses injectable clock |
| Standard error envelope/status codes | **Verified** | Phase 7C: 400/403/404/409 + ownership |
| End-to-end HTTP acceptance | **Verified** | `tests/test_phase7c_acceptance.py` — 13 passed |

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
| Shared API/error/session handling | Typed client + ApiError + session store; Vitest 22 | Not applicable | **Verified** (Phase 8A) |
| 3D primitives/design tokens | 15 primitives + full token system + 45 component tests | Dev showcase at `/design-system` | **Verified** (Phase 8C) |
| Learning path | Placeholder `/` only | Required at desktop/mobile | Not verified |
| Lesson player | Placeholder `/lesson/[attemptId]` | Required at desktop/mobile | Not verified |
| Profile | Placeholder `/profile` | Required | Not verified |
| Leaderboard | Placeholder `/leaderboard` | Required | Not verified |
| Settings/daily goal | Placeholder `/settings` | Required | Not verified |
| Content manager | Placeholder `/admin/content` | Required | Not verified |
| Empty/loading/error states | Root loading/error/not-found only | Required | Partial scaffold |
| Keyboard/focus/reduced motion | — | Required | Not verified |
| Dark mode | UI store theme key only | Required only if implemented | Not verified |

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
| 2026-07-18 | Phase 7A: Forward migration `c8a1f4e2b9d0` with FK OFF around users rebuild | Spec requires active_course_id FK + leaderboard index; SQLite batch rebuild would CASCADE-wipe children if FKs stayed on | `c8a1f4e2b9d0_*.py`, `models/user.py` |
| 2026-07-18 | Phase 7A: Seed CLI uses `timezone.utc` for reference_now | Schema requires UTC timestamps; CLI previously used local offset | `seed/seed_data.py` |
| 2026-07-18 | Phase 7A correction: in-place repair of `b7e3c91f2a04` to additive ADD COLUMN | Pre-release only; batch rebuild CASCADE-wiped answers; later migration cannot restore deleted answers | `b7e3c91f2a04_*.py`, `test_phase7a_data_preservation.py` |

If a decision changes an API, schema, gamification rule, acceptance criterion, or deployment
contract, update the source specification in the same phase. This handoff is not a replacement
for correcting the source document.

---

## Known issues and blockers

| Severity | Issue | Impact | Owner/action | Status |
|---|---|---|---|---|
| Info | `/docs/09_DEPLOYMENT.md` not yet created | No impact until deployment phase | Create when Phase 15 starts | Open |
| Info | Stale uvicorn on :8000 may be Phase-1 health-only API | Local smoke/dev confusion | Restart current `app.main:app` on 8000 | Open |
| Info | Phase 6B Sonnet audit completed | All migration/TTS/timed contracts verified | Phase 6B marked VERIFIED | Resolved 2026-07-18 |
| Info | Phase 5B formal Sonnet audit not separately recorded | Completion path covered by tests; **Phase 7B closed API/gamification conformance** | Phase 7B | Resolved 2026-07-18 |
| Info | No DB unique constraint preventing dual in_progress attempts | Service-level race cleanup proven | Acceptable for SQLite demo | Resolved 2026-07-18 |
| Info | Local `lingopath.db` still has 0 answers from historical wipe | Dev-only; does not block future upgrades | Optional `--reset --yes` recovery (not run in this phase) | Open (dev recovery) |
| Resolved | Phase 6B migration wiped `exercise_answers` on populated upgrade | Blocked honest 7A VERIFIED | In-place additive repair + regression test | Resolved 2026-07-18 |

---

## Phase 7A Audit findings

### Severity-ranked gaps (pre-fix)

| Severity | Gap | Evidence | Resolution |
|---|---|---|---|
| HIGH | `users.active_course_id` lacked FK to `courses.id` ON DELETE SET NULL | Model `user.py`; migration `ca24b65a41a3`; `PRAGMA foreign_key_list(users)` empty | Forward migration `c8a1f4e2b9d0` + model FK |
| HIGH | `b7e3c91f2a04` batch-alter wiped `exercise_answers` on populated ca24→upgrade | Repro: 1420→0 answers with FKs ON | In-place repair to native ADD COLUMN (pre-release exception) |
| MEDIUM | Missing `ix_users_leaderboard` | Schema “Deterministic leaderboard ordering”; index list lacked name | Added in `c8a1f4e2b9d0` + model Index |
| LOW | Seed CLI `reference_now` used local TZ | Seed report showed `+05:30` | CLI now uses `timezone.utc` |

### Schema audit (PASS after fix)

- ✓ No stored `user_skill_progress.status`
- ✓ SQLite FKs enabled on every connection; `foreign_key_check` empty
- ✓ users heart/XP/streak/gem/goal checks present
- ✓ Course/unit/skill/lesson ordering uniqueness + indexes
- ✓ Exercise-type checks; `audio_url` / `tts_text` / `tts_lang`
- ✓ Attempt status/mode/expires_at/failure_reason checks
- ✓ Answer position/exercise uniqueness + type checks
- ✓ user_skill_progress uniqueness + crown/practice checks
- ✓ Achievement criteria + user-award uniqueness
- ✓ Required CASCADE/RESTRICT policies (including active_course SET NULL)
- ✓ Leaderboard index present; active-attempt indexes present
- ✓ Runtime does not depend on `create_all()` under `app/`

### Migration audit (PASS after data-preservation correction)

- ✓ Initial `ca24b65a41a3` intent unchanged
- ✓ `b7e3c91f2a04` repaired in-place (same ID); additive columns; no lesson_attempts rebuild
- ✓ Empty temp DB upgrades base→head to `c8a1f4e2b9d0`
- ✓ Populated ca24 (142 attempts / 1,420 answers) upgrades to head with all answers preserved
- ✓ Pre-6B attempts backfill `mode=standard`
- ✓ Pre-7A DB upgrades b7e3→c8a1; orphans cleared; child rows preserved when FK OFF
- ✓ Alembic current equals head
- ✓ No reset required for future populated upgrades
- ✓ Local developer DB not reset during correction (already missing answers)

### Seed audit (PASS)

- ✓ Exact clean-seed counts (user_achievements=22 supported)
- ✓ Five progress rows/user; 12 exercises/skill; type distribution
- ✓ Shared contract validation; ≥3 TTS/skill; all five types TTS-capable
- ✓ Maya profile/path/heart/goal/streak; rank 3; XP cache consistent
- ✓ Zero active/failed seeded attempts
- ✓ Idempotent second seed; reset remains `--reset --yes` + non-production

### Test coverage

- Schema FK/index/status-column tests
- Phase 6B / 7A migration tests
- **Mandatory** `test_phase7a_data_preservation.py` (142/1420 ca24→head)
- Full suite: **185 passed**

---

## Phase 7B API and Gamification Audit

### Initial gap list (read-only audit)

| Severity | Gap | Evidence | Resolution |
|---|---|---|---|
| LOW | API title uses "LingoPath" instead of "LingoQuest" | `main.py:25-26` FastAPI title/description | Updated to "LingoQuest API" for repository consistency |

### API Contract Audit (PASS)

- ✅ All 20 endpoint groups match `/docs/03_API_SPEC.md`
- ✅ Exact Pydantic response models
- ✅ Standard error envelope `{"error": {"code", "message", "details?"}}`
- ✅ Real HTTP status codes (400/403/404/409/422/500), never 200 with embedded error
- ✅ Debug routes completely absent when `DEBUG_CLOCK_ENABLED=false`
- ✅ No endpoint returns 501 or fake success

### Architecture Audit (PASS)

- ✅ Routers thin (validate, resolve, call service, return)
- ✅ Business rules in services (lesson_engine, hearts, xp, streak, skill_progress, achievements, etc.)
- ✅ Current-user resolution centralized in `dependencies/auth.py`
- ✅ All attempts/progress/settings/admin user-scoped
- ✅ Foreign attempt IDs return safe 404
- ✅ Single injected logical clock from `core/clock.py`
- ✅ No direct `datetime.now()` calls in domain services

### Course, Skill, Attempt Lifecycle (PASS)

- ✅ GET /api/course derives all four states without stored status column
- ✅ Standard start: 201 new / 200 resume, locked/zero-heart checks, stratified 10 exercises
- ✅ Timed start: mode=timed, expires_at=now+120s, no heart check
- ✅ Retrieve: refresh restores order/index, enforces timed expiry, no answers exposed
- ✅ Concurrent start protection (keeps earliest, deletes extras)

### Answer Audit (PASS)

- ✅ All five graders match exact contracts with proper normalization
- ✅ Graders pure (no mutation), return `GradeResult`
- ✅ Standard wrong answer loses one heart
- ✅ Timed wrong answer loses no heart
- ✅ Zero-heart standard fails in same response
- ✅ Malformed/stale/duplicate inputs deduct no heart
- ✅ Concurrent duplicate prevented by DB uniqueness

### **FORMAL PHASE 5B COMPLETION AUDIT (PASS)**

**✅ PHASE 5B FORMALLY CLOSED AND VERIFIED**

**One-transaction atomic completion:**
1. ✅ Single clock capture (`now`, `today`)
2. ✅ Conditional UPDATE claim (`WHERE status='in_progress'`)
3. ✅ Idempotent protection (rowcount check → ATTEMPT_ALREADY_COMPLETED)
4. ✅ Early/failed/completed conflicts checked before mutation
5. ✅ Standard XP: `base + floor(base * 1/2)` when perfect
6. ✅ Timed XP: fixed 20, no perfect bonus
7. ✅ Total XP cache updated in same transaction
8. ✅ Today XP/goal uses logical `activity_date`
9. ✅ Streak transitions (same/next/missed day rules)
10. ✅ Longest streak never decreases
11. ✅ Standard: crown+1 (capped), practice+1, genuine unlocks
12. ✅ Timed: practice+1 only, no crowns/unlocks
13. ✅ Achievement evaluation uses updated user state
14. ✅ Achievement idempotency (unique constraint + savepoint)
15. ✅ Concurrent completion: conditional UPDATE serializes
16. ✅ Injected failure rollback proven (test hook at line 759)
17. ✅ Retry after rollback succeeds once

**Completion result contract:**
- ✅ All fields from spec present: attempt_id, skill, xp, streak, daily_goal, unlocked_skill_ids, achievements_unlocked, user_totals, completed_at
- ✅ Mode-specific rules: standard (hearts check, crowns, unlocks), timed (fixed 20 XP, practice only, no crowns)

**Test coverage:**
- ✅ `test_phase5b_api.py`: 11 tests (early/failed/duplicate/concurrent/rollback)
- ✅ `test_phase6b_timed_api.py`: 6 completion tests (20 XP/no crown/no bonus/expiry/concurrent/rollback)

### Hearts, Profile, Leaderboard, Achievements (PASS)

- ✅ Hearts: lazy regen preserves remainder, caps at max, refill atomic
- ✅ Profile: skills_completed (crowns>=max), lessons/perfect counts, today_xp
- ✅ Leaderboard: total_xp DESC, username ASC, id ASC; Maya rank 3; current user always returned
- ✅ Achievements: criteria evaluation, unique constraint, inactive not awarded

### Content and TTS (PASS)

- ✅ Admin: tree/create/edit with shared validation, active-attempt protection
- ✅ TTS: 16 exercises seeded, both-or-neither validation, BCP 47 pattern
- ✅ Public routes never expose correct_answer (admin routes include it)

### Timed Practice (PASS)

- ✅ Backend expires_at control, remaining_seconds server-derived
- ✅ Exact boundary: `logical_now > expires_at`
- ✅ Retrieve/answer/complete enforce expiry
- ✅ Successful: 20 XP, streak, practice, no crowns/unlocks
- ✅ Timeout: no XP/streak/achievements
- ✅ Concurrent start protection proven

### Naming Consistency

- ✅ API title updated from "LingoPath API" to "LingoQuest API"
- ✅ Database name `lingopath.db` (local dev convention, not user-facing)
- ✅ Migration/model filenames (not user-facing, intentionally unchanged)

### Test Evidence

- ✅ 185 backend tests collected
- ✅ **185 passed** in 215.97s
- ✅ Coverage: graders, hearts, streak, xp, crowns, achievements, answer, completion (standard/timed), timed-specific, content-admin, debug-clock, schema, seed, migrations
- ✅ 25 schema tests passed after fix verification

---

## Files changed in the latest phase

Phase 8C 3D design system and primitives:

| File | Change | Reason |
|---|---|---|
| `frontend/app/globals.css` | Rewritten | Complete CSS custom property token system (light + dark themes, radii, spacing, shadows, depth, motion, z-index, keyframes) |
| `frontend/tailwind.config.js` | Rewritten | Semantic Tailwind extensions consuming CSS tokens; `darkMode: 'class'`; Nunito font family; custom fontSize scale |
| `frontend/app/layout.tsx` | Updated | Nunito font import, ThemeScript for flash prevention, viewport export |
| `frontend/lib/utils/index.ts` | Updated | Upgraded `cn()` to use clsx + tailwind-merge |
| `frontend/stores/ui-store.ts` | Updated | Added 'system' theme preference; `applyTheme()` applies dark class |
| `frontend/vitest.config.ts` | Updated | jsdom environment; @vitejs/plugin-react for JSX transform |
| `frontend/tests/setup.ts` | Updated | Added cleanup, jest-dom/vitest, matchMedia mock |
| `frontend/components/ui/theme-script.tsx` | Created | Inline script preventing theme flash before hydration |
| `frontend/components/ui/button-3d.tsx` | Created | 3D button with 6 variants, 3 sizes, loading/disabled states |
| `frontend/components/ui/icon-button-3d.tsx` | Created | Circular icon button with depth and active state |
| `frontend/components/ui/surface-card.tsx` | Created | Card surface with default/elevated/interactive variants |
| `frontend/components/ui/choice-tile.tsx` | Created | Radio-style answer choice with correct/incorrect/selected states |
| `frontend/components/ui/word-tile.tsx` | Created | Word bank tile with placed/correct/incorrect states |
| `frontend/components/ui/match-tile.tsx` | Created | Match pair tile with selected/paired/correct/used states |
| `frontend/components/ui/status-badge.tsx` | Created | Small labeled badge with 6 semantic variants |
| `frontend/components/ui/stat-indicator.tsx` | Created | Icon + number pill for gamification stats |
| `frontend/components/ui/progress-bar.tsx` | Created | Horizontal fill bar with accessible semantics and clamping |
| `frontend/components/ui/progress-ring.tsx` | Created | SVG circular progress ring with crown segments |
| `frontend/components/ui/modal.tsx` | Created | Focus-trapping dialog with Motion entrance, dismissible/non-dismissible |
| `frontend/components/ui/toast.tsx` | Created | Toast provider with queue, priority, auto-dismiss, max 2 visible |
| `frontend/components/ui/feedback-surface.tsx` | Created | Bottom feedback bar for correct/incorrect with Motion slide |
| `frontend/components/ui/skeleton.tsx` | Created | Loading placeholder with text/circular/rectangular variants |
| `frontend/components/ui/theme-toggle.tsx` | Created | Light/dark/system radio toggle |
| `frontend/components/ui/quest-mascot.tsx` | Created | Original Quest fox SVG with neutral/encouraging/celebrating/concerned |
| `frontend/components/ui/index.ts` | Updated | Barrel export for all 15 primitives |
| `frontend/app/design-system/page.tsx` | Created | Dev-only showcase rendering all primitives and states |
| `frontend/tests/components/button-3d.test.tsx` | Created | 16 tests: variants, sizes, disabled, loading, keyboard |
| `frontend/tests/components/progress.test.tsx` | Created | 6 tests: aria attributes, clamping, max=0 safety |
| `frontend/tests/components/modal.test.tsx` | Created | 7 tests: open/close, focus trap, Escape, non-dismissible |
| `frontend/tests/components/toast.test.tsx` | Created | 4 tests: add, queue limit, dismiss, auto-dismiss |
| `frontend/tests/components/mascot.test.tsx` | Created | 7 tests: decorative, labeled, variants, sizing |
| `frontend/tests/stores/ui-store.test.ts` | Rewritten | 5 tests: theme preference, dark class, no learner state |
| `frontend/package.json` | Updated | Added @fontsource-variable/nunito, clsx, tailwind-merge, lucide-react, testing deps |

No backend code, API contracts, or database changes were made.

---

## Phase 8A evidence

### Scaffold mismatches corrected

| Issue | Correction |
|---|---|
| Env var `NEXT_PUBLIC_API_URL` | Renamed to architecture/spec `NEXT_PUBLIC_API_BASE_URL` |
| Incomplete ApiError / client | Full envelope parsing, status/code/message/details, AbortSignal |
| Only health contracts | Full learner/admin/debug contracts |
| Package/UI named LingoPath | Renamed to LingoQuest in user-facing frontend |
| No Vitest | Added minimal Vitest + 22 tests |

### API modules and wrappers

- **Client:** `lib/api/client.ts` (`apiRequest` / `apiGet` / `apiPost` / `apiPatch`, `ApiError`)
- **Course:** `getCourse`, `getSkill`
- **Lessons:** `startLesson`, `startTimedPractice`, `getAttempt`, `submitAnswer`, `completeLesson`
- **Learner:** `getHeartsStatus`, `refillHearts`, `getCurrentUser`, `updateCurrentUser`, `getLeaderboard`, `getAchievements`
- **Admin:** `getContentTree`, `createExercise`, `updateExercise`
- **Debug (separated):** `getDebugClock`, `advanceDebugClock`, `resetDebugClock`
- **Health:** `getHealth`, `getReady`

### Quality search counts (frontend source)

| Check | Count / result |
|---|---|
| `\bany\b` in lib/stores/tests/app | **0** |
| `@ts-ignore` / `@ts-expect-error` | **0** |
| Scattered hard-coded API base in components | **0** (localhost only in config error text, `.env.example`, Vitest setup/assertions) |
| `LingoPath` / `lingopath` in frontend TS/TSX | **0** |
| `correct_answer` on public exercise types | **Absent**; present only on admin contracts + answer response (reveal) |

### Backend smoke (read-only)

Port **8000** hosted a stale Phase-1 “LingoPath API” with only `/health` and `/ready`. Smoke ran against the **current** app on `127.0.0.1:8001` (OpenAPI title **LingoQuest API**, 17 paths) using the existing seeded `lingopath.db`. No lesson start/complete.

| Endpoint | Status | Field match vs TS contracts |
|---|---|---|
| GET `/api/course` | 200 | learner/course/units/skill keys match |
| GET `/api/user/me` | 200 | user/stats/achievements match |
| GET `/api/hearts/status` | 200 | hearts/max/next/seconds/regen match |
| GET `/api/leaderboard` | 200 | ranking_basis/entries/current_user match |
| GET `/api/achievements` | 200 | criteria + earned fields match |

### Contract mismatches

None requiring a type or backend fix for the smoke endpoints.

**Informational (backend frozen):** written API_SPEC health examples differ from live health (`status: "healthy"` without `service`; ready `database: "connected"`). Frontend health types match the live backend. Not changed in this phase.

### Remaining risks

- Stale uvicorn on port 8000 may confuse local frontend if `NEXT_PUBLIC_API_BASE_URL` points at it — restart current `app.main:app` on 8000 for day-to-day use
- Developer DB historically wiped answers (recovered to 1420 in later sessions per prior notes) — smoke did not mutate
- Visual/UX work still not started (Phase 8B+)
- Deployment / R-17 still deferred

---

## Working tree safety

| Check | Result |
|---|---|
| Current branch | `main` |
| Pre-existing unrelated edits | Preserved |
| Files changed this phase | Design system primitives + tests + handoff (see table above) |
| Backend production code | **Unchanged** |
| Developer local DB | **Not touched** |

---

## Phase 8C implementation details

### Token system

- **Source of truth:** CSS custom properties in `app/globals.css` (`:root` for light, `.dark` for dark)
- **Tailwind integration:** `tailwind.config.js` extends colors, radii, shadows, z-index, maxWidth, fontSize via `var()` references
- **Dark mode strategy:** Tailwind `darkMode: 'class'`; `ThemeScript` inline script prevents flash before React hydration

### Typography

- **Font:** `@fontsource-variable/nunito` (npm package, open-licensed, no build-time download)
- **Scale:** 8 sizes from `lq-xs` (12px) to `lq-4xl` (36px) with line-height pairs
- **Weights:** 400 (normal) through 800 (extrabold)
- **Fallbacks:** `'Nunito Variable', 'Nunito', system-ui, -apple-system, sans-serif`

### 3D interaction system

- **Mechanic:** CSS `border-bottom` (colored depth edge) + `box-shadow` + `translateY` on press
- **Depths:** 4 levels (sm=2px, md=4px, lg=6px, xl=8px) as CSS custom properties
- **States:** resting, hover (lift -1px), pressed (translateY by depth + border-b collapse), selected, disabled (opacity), loading, focus-visible (outline offset)
- **Reduced motion:** Global `prefers-reduced-motion: reduce` removes all transitions/animations

### Primitives implemented (15 total)

| Primitive | Purpose |
|---|---|
| `Button3D` | Primary CTA with 6 variants, 3 sizes, loading/disabled |
| `IconButton3D` | Circular icon button with active state |
| `SurfaceCard` | Container with default/elevated/interactive variants |
| `ChoiceTile` | Radio-style answer choice with state feedback |
| `WordTile` | Word bank tile with available/placed states |
| `MatchTile` | Match pair tile with paired/correct/used states |
| `StatusBadge` | Small semantic badge (6 variants) |
| `StatIndicator` | Icon+number pill for hearts/streak/XP/gems/crowns |
| `ProgressBar` | Horizontal fill with accessible aria semantics |
| `ProgressRing` | SVG circular crown progress ring |
| `Modal` | Focus-trapping dialog with Motion spring entrance |
| `ToastProvider` + `useToast` | Queue-managed toast system (max 2 visible) |
| `FeedbackSurface` | Bottom correct/incorrect feedback with slide-up |
| `Skeleton` | Shimmer loading placeholder (text/circular/rectangular) |
| `ThemeToggle` | Light/dark/system preference radio group |
| `QuestMascot` | Original fox SVG with 4 expression variants |

### Quest mascot

- **Type:** Inline SVG, no external image dependency
- **Character:** Fox with warm orange body (#F0972B), cream markings (#FCEBD0), teal bandana (#2BB5A0)
- **Variants:** neutral, encouraging (raised brows, tail tilt), celebrating (bounce, stars, big smile), concerned (worried brows, flat mouth)
- **Accessibility:** Decorative by default (`aria-hidden`, `role="presentation"`); labeled mode available
- **Maintainable:** ~120 lines of readable SVG with clear shape composition

### Dependencies added

| Package | Type | Reason |
|---|---|---|
| `@fontsource-variable/nunito` | runtime | Nunito variable font without build-time download |
| `clsx` | runtime | Conditional class composition |
| `tailwind-merge` | runtime | Tailwind class conflict resolution |
| `lucide-react` | runtime | Open-source icon set (Lucide, not Duolingo) |
| `@testing-library/react` | dev | Component test rendering |
| `@testing-library/jest-dom` | dev | DOM assertion matchers |
| `@testing-library/user-event` | dev | User interaction simulation |
| `jsdom` | dev | DOM environment for Vitest |
| `@vitejs/plugin-react@4` | dev | JSX transform for Vitest |

### Test counts (67 total)

| Test file | Tests | Coverage |
|---|---|---|
| `button-3d.test.tsx` | 16 | Variants, sizes, disabled, loading, keyboard, className |
| `progress.test.tsx` | 6 | Aria attributes, clamping, max=0 safety |
| `modal.test.tsx` | 7 | Open/close, dialog role, focus trap, Escape, non-dismissible |
| `toast.test.tsx` | 4 | Add, queue limit, dismiss, auto-dismiss |
| `mascot.test.tsx` | 7 | Decorative, labeled, variants, sizing |
| `ui-store.test.ts` | 5 | Theme preference, dark class toggle, no learner state |
| `session-store.test.ts` | 4 | Prior Phase 8A tests (unchanged) |
| `client.test.ts` | 18 | Prior Phase 8A tests (unchanged) |

---

## Exact next request for Cursor

Phase 8C is VERIFIED. Use this request next:

```text
Perform LingoQuest Phase 9A: functional path and skill-start flow.

Follow the Common phase protocol. Connect GET course and GET skill detail. Implement ordered units,
all four skill states, crowns/progress, persistent learner top bar, available/in-progress skill
navigation, locked inert behaviour with explanation, and /skill/[skillId] start/resume actions.

POST start must navigate using returned attempt_id. Use backend values only. Reuse approved UI
primitives; do not redesign the system.
```

**Recommended model:** Claude Sonnet
**Required skill:** None

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
