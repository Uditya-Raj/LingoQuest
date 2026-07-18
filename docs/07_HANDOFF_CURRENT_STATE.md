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
| Current phase | Phase 3 — Seed content and consistent history |
| Current phase status | `VERIFIED` |
| Next action | Perform Phase 4 — Course, skill, start, and retrieve APIs. |
| Recommended model | Claude Sonnet |
| Required skill | None for Phase 3 |
| Last updated | 2026-07-18 |
| Updated by | Phase 2 database schema completion |
| Active blocker | None. Database schema is complete and verified. |

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
| Course/path API | `NOT_STARTED` | Router structure exists but no business endpoints. |
| Skill detail/start/resume API | `NOT_STARTED` | Not implemented. |
| Exercise answer validation | `NOT_STARTED` | Not implemented. |
| Lesson completion transaction | `NOT_STARTED` | Not implemented. |
| Hearts loss, regeneration, and refill | `NOT_STARTED` | Not implemented. |
| XP, daily goal, and total consistency | `NOT_STARTED` | Not implemented. |
| Streak clock logic | `VERIFIED` | Clock abstraction implemented with real and debug clocks. |
| Crowns and server-derived locks | `NOT_STARTED` | Not implemented. |
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
| Automated test suite | `PARTIAL` | Backend health endpoint tests pass. Frontend tests not yet added. |
| Production builds | `VERIFIED` | Both frontend build and backend startup verified. |
| Deployment and persistent SQLite | `NOT_STARTED` | Deferred; deployment spec missing. |
| README and submission evidence | `NOT_STARTED` | No `README.md` exists. |

---

## Current phase contract

### Phase

Phase 3 — Seed content and consistent history

### Objective

Implement deterministic seed content with internally consistent learner history exactly according
to the seed specification.

### Allowed work

- Implement seed modules: content.py, history.py, validators.py, seed_data.py
- Create 60 reviewed Spanish exercises across 5 skills
- Generate 5 users with 142 completed attempts and 1,420 answers
- Implement idempotent seeding and explicit development-only reset
- Run all Phase 3 exit checks and verification

### Exit evidence required

- 60 exercises with exact type distribution per skill
- Zero invalid exercise contracts
- Each user's stored XP equals completed-attempt XP (zero differences)
- Maya's profile matches seed specification exactly
- Leaderboard order correct with Maya at rank 3
- Zero active seeded attempts
- Zero foreign-key violations
- Second seed run produces no duplicates
- All backend tests pass (health + schema)

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
| Course path and derived locks | Not verified | — |
| Skill detail/start/retrieve/resume | Not verified | — |
| All five answer shapes | Not verified | — |
| Attempt ordering/idempotency/conflicts | Not verified | — |
| Completion transaction | Not verified | — |
| Hearts status/refill | Not verified | — |
| User profile/settings | Not verified | — |
| Leaderboard | Not verified | — |
| Achievements | Not verified | — |
| Content management | Not verified | — |
| Debug clock safety | Not verified | — |
| Standard error envelope/status codes | Not verified | — |

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

| File | Change | Reason |
|---|---|---|
| `backend/app/seed/validators.py` | Created | Shared Pydantic v2 validators for all five exercise contracts |
| `backend/app/seed/content.py` | Created | Course, units, skills, lessons, 60 Spanish exercises, 6 achievements |
| `backend/app/seed/history.py` | Created | Five users with deterministic attempt history recipes |
| `backend/app/seed/seed_data.py` | Created/Updated | CLI, idempotent seeding, reset, verification with exact count checking |
| `backend/tests/test_seed.py` | Created | 7 seed integration tests covering counts, XP, Maya state, FK, idempotency |

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

Phase 3 is complete. Use this request to begin backend API implementation:

```text
Perform LingoQuest Phase 4 from /docs/06_IMPLEMENTATION_PHASES.md using Claude Sonnet.

Read these first:
1. .cursor/rules/project-rules.mdc
2. /CLAUDE.md
3. /docs/07_HANDOFF_CURRENT_STATE.md
4. The Phase 4 section of /docs/06_IMPLEMENTATION_PHASES.md
5. /docs/01_ARCHITECTURE.md — layers, state ownership, attempt lifecycle
6. /docs/02_DATABASE_SCHEMA.md — content/progress/attempt tables
7. /docs/03_API_SPEC.md — Shared learner summary, Course, Public exercise contracts, Lesson start/retrieve
8. /docs/04_GAMIFICATION_LOGIC.md — Logical clock, Starting/resuming, derived skill state

Implement thin routers, exact Pydantic response models, and services for:
- GET /api/course (path with derived skill states)
- GET /api/skills/{skill_id} (skill detail for start screen)
- POST /api/skills/{skill_id}/start (create or resume attempt)
- GET /api/lessons/{attempt_id} (retrieve for refresh/direct navigation)

Run Phase 4 exit checks and update the handoff. Stop after Phase 4.
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