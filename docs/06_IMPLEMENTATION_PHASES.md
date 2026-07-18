# LingoQuest — Implementation Phases for Cursor

## Purpose

This document breaks implementation into bounded Cursor tasks. Do not give Claude the whole
project in one prompt. Run one phase or subphase, verify it, update the handoff, and then continue.

Permanent project scope lives in specifications. Current progress lives only in
`/docs/07_HANDOFF_CURRENT_STATE.md`.

## Model policy

Use the newest available model in the selected Claude tier.

| Work | Model |
|---|---|
| Architecture, schema, backend, integration, routine frontend, tests, fixes | **Sonnet** |
| UX planning, 3D visual system, critical path/lesson visuals, final screenshot polish | **Opus** |
| Formatting already-decided README/tables or mechanical edits | **Haiku/fast**, optional |

Opus owns visual judgment, not boilerplate. Do not use Opus for migrations, seed dictionaries,
CRUD endpoints, routine API wiring, or test-output formatting.

## Installed frontend skills

Only these project skills exist:

```text
.claude/skills/ui-ux-pro-max/SKILL.md
.claude/skills/frontend-design/SKILL.md
```

Use them in stages:

1. **Opus + `ui-ux-pro-max`:** UX hierarchy, responsive composition, states, accessibility.
2. **Opus + `frontend-design`:** visual language, tactile 3D primitives, typography, motion.
3. **Sonnet:** API wiring and repeated implementation using approved primitives.
4. **Opus + `frontend-design`:** final screenshot-based polish.

Do not reference nonexistent `duolingo-3d-ui` or `frontend-qa` skills. Frontend verification is
defined in `/docs/08_TESTING_ACCEPTANCE.md`.

## Common phase protocol

Apply this protocol to every phase prompt below:

1. Read `.cursor/rules/project-rules.mdc` and `/docs/07_HANDOFF_CURRENT_STATE.md` first.
2. Read only the listed documents/headings for the current phase.
3. Inspect existing code before editing; preserve working code and unrelated user changes.
4. If the phase is already complete, verify it rather than rebuilding it.
5. State a short plan of 3–7 steps.
6. Report specification conflicts before deviating. Otherwise make reasonable in-scope decisions.
7. Implement only the stated scope.
8. Run the phase exit checks.
9. Fix failures caused by the phase before stopping.
10. Update `/docs/07_HANDOFF_CURRENT_STATE.md` with files changed, decisions, commands/results,
    remaining issues, and exact next phase.
11. Stop. Do not begin the next phase in the same request.

No phase is complete merely because files were generated.

## Choosing the starting phase

### Empty/new repository

Start at Phase 0, then follow the phases in order.

### Existing repository

Run Phase 0 first. Use the handoff and actual code to choose:

- Missing foundation: continue from the first incomplete build phase.
- Backend reported complete: run Phase 7A, 7B, and 7C conformance audits before frontend work.
- Frontend partially built: audit its backend dependency first, then continue from the first
  incomplete frontend acceptance criterion.

Never rerun schema/seed/backend phases blindly because an old note says to do so.

---

## Phase 0 — Repository preflight and handoff

**Model:** Sonnet

**Load:**

- `/docs/00_REQUIREMENTS_TRACEABILITY.md`
- `/docs/00_MASTER.md`
- `/docs/01_ARCHITECTURE.md` — repository layout only
- Existing `/docs/07_HANDOFF_CURRENT_STATE.md`, if present

**Prompt:**

```text
Perform LingoQuest Phase 0: repository preflight only.

Follow the Common phase protocol in /docs/06_IMPLEMENTATION_PHASES.md.

Inspect the repository structure, git status, package manifests, migration history, existing
routes/services/components/tests, environment examples, Cursor rule, and the two installed skills.
Do not implement product features in this phase.

Create or correct /docs/07_HANDOFF_CURRENT_STATE.md using verified evidence. Classify every major
area as complete, partial, stub, broken, or missing. Record runnable commands and the first
incomplete phase. Do not trust comments or old handoff claims without checking the code.
```

**Exit checks:**

- Handoff exists and contains evidence, not guesses.
- Existing commands and current failures are recorded.
- No product code was unnecessarily changed.
- Exact next phase/subphase is identified.

---

## Phase 1 — Scaffolding (only if missing)

**Model:** Sonnet

**Load:**

- `/docs/01_ARCHITECTURE.md` — technology and repository layout
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 1: scaffold only the missing foundation.

Follow the Common phase protocol. Implement the repository layout from the architecture document:
Next.js App Router + strict TypeScript + Tailwind + Zustand + Motion in /frontend, and FastAPI +
Pydantic + SQLAlchemy async + Alembic + pytest in /backend.

Add validated environment configuration, SQLite foreign-key setup, explicit CORS allowlist,
/api/health, /api/ready, .env.example files, and appropriate .gitignore entries. Do not implement
domain models, seed content, business endpoints, or production screens yet.
```

**Exit checks:**

- Frontend dev server and production type/build command start successfully.
- Backend starts and health/readiness behave correctly.
- Strict TypeScript and Python test command run.
- No `.env`, database, dependency, or build output is tracked.

---

## Phase 2 — Database models and migrations

**Model:** Sonnet

**Load:**

- `/docs/01_ARCHITECTURE.md` — backend layout and SQLite rules
- `/docs/02_DATABASE_SCHEMA.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 2: database models and Alembic migrations.

Follow the Common phase protocol. Implement every table, column, FK policy, named check, unique
constraint, and index from /docs/02_DATABASE_SCHEMA.md. Use SQLAlchemy 2.0 typed models split by
domain. Do not add a stored user_skill_progress.status column.

Configure Alembic metadata and generate/review a forward migration. If an earlier schema exists,
preserve valid data through migration rather than deleting the database. Add schema integration
tests including PRAGMA foreign_keys and representative constraint failures.
```

**Exit checks:**

- Empty database upgrades to head.
- Existing database has a safe forward path when applicable.
- Foreign keys are active.
- Schema tests cover enum/check/unique/FK constraints.
- Runtime does not rely on `create_all()`.

---

## Phase 3 — Seed content and consistent history

**Model:** Sonnet

**Load:**

- `/docs/02_DATABASE_SCHEMA.md` — relevant tables
- `/docs/03_API_SPEC.md` — Public exercise contracts only
- `/docs/05_SEED_DATA.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 3: deterministic seed data.

Follow the Common phase protocol. Implement app/seed/content.py, history.py, validators.py, and
seed_data.py exactly from /docs/05_SEED_DATA.md. Use the same exercise-contract validators that
the content-admin service will use. Create 60 reviewed exercises, five consistent users, 142
completed attempts, 1,420 answers, progress rows, and supported achievements.

Implement idempotent default seeding, explicit development-only reset, reference-date support,
and the required verification report. Do not fake cached XP or achievement state.
```

**Exit checks:**

- Expected row counts match.
- All exercise contracts pass.
- Each skill has the required type distribution.
- Stored XP equals completed-attempt sums for every user.
- Maya's path/profile/goal/streak/achievement state matches the seed spec.
- Second normal seed run adds no duplicates.
- Foreign-key check is empty.

---

## Phase 4 — Course, skill, start, and retrieve APIs

**Model:** Sonnet

**Load:**

- `/docs/01_ARCHITECTURE.md` — layers, state ownership, attempt lifecycle
- `/docs/02_DATABASE_SCHEMA.md` — content/progress/attempt tables
- `/docs/03_API_SPEC.md` — Shared learner summary, Course, Public exercise contracts, Lesson start/retrieve
- `/docs/04_GAMIFICATION_LOGIC.md` — Logical clock, Starting/resuming, derived skill state
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 4: course path, skill detail, lesson start/resume, and attempt retrieve.

Follow the Common phase protocol. Implement thin routers, exact Pydantic response models, and
services for GET /api/course, GET /api/skills/{skill_id}, POST /api/skills/{skill_id}/start, and
GET /api/lessons/{attempt_id}.

Implement one authoritative skill-state derivation, lazy hearts before summaries/start, stratified
10-exercise selection with all five types, duplicate-start protection, ownership scoping, and
answer redaction. The URL attempt retrieve must restore a lesson after refresh.
```

**Exit checks:**

- Seeded path returns all four states correctly.
- Start returns 201 new/200 resume and no correct answers.
- Locked/zero-heart start conflicts correctly.
- Refresh retrieves exact persisted order/current index.
- Foreign attempt IDs return 404.
- API/OpenAPI response schemas match the spec.

---

## Phase 5A — Exercise grading and answer transaction

**Model:** Sonnet

**Load:**

- `/docs/02_DATABASE_SCHEMA.md` — attempts and answer audit
- `/docs/03_API_SPEC.md` — Public exercise contracts and Answer endpoint
- `/docs/04_GAMIFICATION_LOGIC.md` — Exercise grading, Answer transaction, Hearts, Failure
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 5A: pure graders and POST lesson answer.

Follow the Common phase protocol. Implement pure validated graders for all five types and the
atomic answer service/route. Enforce owned in-progress attempt, expected position/exercise,
duplicate protection, answer audit snapshots, current-index advancement, lazy regeneration,
single-heart loss, and immediate zero-heart failure.

Malformed/stale/duplicate input must not deduct hearts. Return the exact answer response and error
codes from the API spec.
```

**Exit checks:**

- Unit tests cover correct/incorrect/malformed cases for all five types.
- Out-of-order and duplicate requests leave state unchanged.
- Wrong answer removes one heart and advances once.
- Zero heart fails in the same response and awards no XP.
- Correct answers remain hidden until submission.

---

## Phase 5B — Completion and gamification

**Model:** Sonnet

**Load:**

- `/docs/02_DATABASE_SCHEMA.md` — completion-related tables
- `/docs/03_API_SPEC.md` — Complete, Hearts, Achievements response contracts
- `/docs/04_GAMIFICATION_LOGIC.md` — remaining sections
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 5B: atomic lesson completion and gamification services.

Follow the Common phase protocol. Implement hearts regeneration/refill, XP and perfect bonus,
logical-date daily XP/goal, streak, crowns/practice, derived unlock transitions, achievements, and
POST /api/lessons/{attempt_id}/complete. Use one captured clock value and one transaction.

Implement conditional/idempotent completion so concurrent requests can produce effects only once.
Return the exact completion contract.
```

**Exit checks:**

- Gamification unit-test matrix passes.
- Early, failed, and duplicate completion conflict without effects.
- Successful completion updates all state atomically.
- Profile/path/leaderboard sources agree after refresh.
- 20-gem refill works and failed refill spends nothing.

---

## Phase 6 — Remaining backend endpoints

**Model:** Sonnet

**Load:**

- Relevant headings only from `/docs/03_API_SPEC.md`: Hearts, User, Leaderboard, Achievements,
  Content administration, Debug clock
- `/docs/04_GAMIFICATION_LOGIC.md` — corresponding service sections
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 6: remaining backend endpoints.

Follow the Common phase protocol. Implement GET heart status, POST refill, GET/PATCH user/me, GET
leaderboard, GET achievements, admin content tree, admin exercise create/edit, and development-only
clock routes. Reuse services; do not duplicate calculations in routers.

Implement centralized default-user and content-admin dependencies, standard errors, deterministic
ranking, complete merged-patch exercise validation, and active-attempt content edit protection.
```

**Exit checks:**

- Every endpoint matches the API spec and OpenAPI model.
- Daily goal edit persists and recomputes progress.
- Maya is rank three; current user always returns.
- Admin create/edit validates all five types.
- Debug endpoints are absent unless enabled.
- No placeholder endpoint returns 501.

---

## Phase 6B — Timed-practice backend and forward migration

**Model:** Sonnet

**Load:**

- `/docs/02_DATABASE_SCHEMA.md` — lesson_attempts table with new fields
- Timed-practice rules from `/docs/04_GAMIFICATION_LOGIC.md`
- Timed-practice sections from `/docs/03_API_SPEC.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 6B: timed-practice backend and database migration.

Follow the Common phase protocol. Generate and review a forward Alembic migration adding mode
(standard/timed), expires_at (nullable DATETIME), and failure_reason (nullable TEXT) to
lesson_attempts with appropriate check constraints.

Implement POST /api/skills/{skill_id}/start-timed, timed-mode expiry enforcement in retrieve/
answer/complete, fixed 20 XP award, no heart consumption in timed mode, time_expired failure,
and practice-count-only updates. Use the injectable logical clock for expiry checks.

Preserve existing standard-mode data and behavior. Add backend unit/integration tests.
```

**Exit checks:**

- Migration applies to existing seeded database without data loss.
- Standard mode attempts remain unaffected.
- Timed attempts enforce 120-second expiry.
- Expired attempts fail with time_expired and award zero XP.
- Successful timed completion awards 20 XP and updates streak/practice without crowns/unlocks.
- Wrong answers in timed mode do not consume hearts.
- All backend tests pass including new timed-mode scenarios.

---

## Phase 7A — Existing backend schema/seed conformance audit

**Model:** Sonnet

**Use when:** Backend code already exists or after Phases 2–3.

**Load:**

- Requirements R-03, R-08, R-09, R-10, R-11, R-12
- `/docs/02_DATABASE_SCHEMA.md`
- `/docs/05_SEED_DATA.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 7A: read-only schema/seed conformance audit first.

Follow the Common phase protocol. Compare actual models, migrations, indexes, constraints, seed
content, and seeded history against the listed specifications. Run migrations/seed verification.
Produce a severity-ranked gap list with file evidence.

After the audit, fix only schema/seed gaps required for conformance, using forward migrations.
Do not redesign working APIs or frontend in this phase.
```

**Exit checks:**

- Schema acceptance checks pass.
- Seed counts/contracts/cache consistency pass.
- No stored public skill status remains.
- Handoff records migrations and any compatibility impact.

---

## Phase 7B — Existing backend API/gamification conformance audit

**Model:** Sonnet

**Load:**

- Requirements R-01 through R-12
- Relevant endpoint headings from `/docs/03_API_SPEC.md`
- `/docs/04_GAMIFICATION_LOGIC.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 7B: backend API and gamification conformance.

Follow the Common phase protocol. First audit actual routes, schemas, services, ownership,
transactions, time dependency, errors, and OpenAPI against the specs. Identify exact mismatches.
Then fix only required backend gaps, keeping routers thin and preserving working code.

Pay special attention to attempt refresh/resume, answer order/duplicates, zero-heart failure,
completion idempotency, daily activity_date, derived skill state, and admin content validation.
```

**Exit checks:**

- All API acceptance checks pass.
- All gamification unit/integration scenarios pass.
- No learner endpoint leaks answers.
- Duplicate/concurrent requests cannot create double effects.

---

## Phase 7C — Backend end-to-end acceptance gate

**Model:** Sonnet

**Load:**

- Requirements acceptance criteria R-01 through R-12
- `/docs/08_TESTING_ACCEPTANCE.md` — backend sections, once available
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 7C: backend acceptance gate only.

Follow the Common phase protocol. Run the real seeded API through path -> skill -> start ->
retrieve -> all five answer types -> complete -> profile/path/leaderboard refresh. Also run the
zero-heart/refill/retry flow and one content create/edit validation flow.

Add/fix tests needed to prove the acceptance criteria. Do not start frontend work until the gate
is green.
```

**Exit checks:**

- Core success and failure workflows pass against SQLite.
- Cross-endpoint totals/states agree.
- Handoff declares backend acceptance green with command evidence.

---

## Phase 8A — Frontend API foundation

**Model:** Sonnet

**Load:**

- `/docs/01_ARCHITECTURE.md` — frontend layout, state ownership, error architecture
- Relevant shared/error shapes from `/docs/03_API_SPEC.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 8A: frontend API and routing foundation.

Follow the Common phase protocol. Implement environment-backed typed API client, ApiError,
TypeScript contracts, routes, providers, loading/error/not-found boundaries, and UI-only Zustand
store. Create no final screen design yet.

Do not store authoritative hearts, XP, streak, crowns, lock state, correct answers, or attempt
progress in Zustand. The lesson route must be /lesson/[attemptId].
```

**Exit checks:**

- Strict typecheck/lint/build pass.
- Typed client handles standard errors.
- Required routes render safe placeholders/skeleton boundaries.
- No duplicated API base URLs or `any` contracts.

---

## Phase 8B — UX blueprint

**Model:** **Opus**

**Skill:** `ui-ux-pro-max`

**Load:**

- Requirements R-01 through R-15 and committed responsive bonus
- `/docs/01_ARCHITECTURE.md` — Frontend design/accessibility sections
- Handoff
- Existing frontend structure and any provided assignment screenshots only

**Prompt:**

```text
Perform LingoQuest Phase 8B using Opus and the ui-ux-pro-max skill: create the frontend UX blueprint.

Follow the Common phase protocol. Inspect the existing frontend and define the information
hierarchy, responsive layouts, navigation, interaction/state matrix, accessibility requirements,
and screen-to-screen journey for path, skill start, lesson, feedback, failure, results, profile,
leaderboard, settings, and content admin.

Keep the experience original and branded LingoQuest. Do not copy real Duolingo assets or exact
copy. Do not implement full screens yet. Persist the approved compact blueprint in
/frontend/design-system.md so later chats do not re-decide it.
```

**Exit checks:**

- Every required screen/state is covered.
- Mobile/tablet/desktop behaviour is explicit.
- Keyboard, focus, reduced-motion, loading/error/empty/disabled states are defined.
- Blueprint is concise enough to load with frontend phases.

---

## Phase 8C — 3D design system and primitives

**Model:** **Opus**

**Skill:** `frontend-design`

**Load:**

- `/frontend/design-system.md`
- `/docs/01_ARCHITECTURE.md` — Frontend design architecture
- Existing frontend theme/components
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 8C using Opus and the frontend-design skill: implement the original 3D
design system and critical primitives.

Follow the Common phase protocol. Define light-theme tokens, dark-ready semantic tokens,
typography, spacing, radii, layered depth, pressed/hover/focus/disabled/loading behaviour, and
purposeful motion. Implement reusable Button3D, IconButton3D, Card3D, SkillNode3D, ProgressBar,
ProgressRing, FeedbackSheet, Modal3D, and StatPill primitives with accessible semantics.

Use CSS/Tailwind depth and Motion; do not add Three.js/WebGL, real Duolingo assets, or generic
dashboard styling. Build a temporary internal showcase route/component if useful, but do not
build production screens in this phase.
```

**Exit checks:**

- Primitives render at mobile and desktop widths.
- Mouse, keyboard, touch, focus, reduced-motion, disabled/loading states work.
- Typecheck/lint/build pass.
- Shared tokens/primitives are documented in `/frontend/design-system.md`.
- No screen-specific duplicated 3D CSS.

---

## Phase 9A — Learning-path functionality

**Model:** Sonnet

**Load:**

- Course and skill sections of `/docs/03_API_SPEC.md`
- `/frontend/design-system.md`
- Existing approved primitives
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 9A: functional path and skill-start flow.

Follow the Common phase protocol. Connect GET course and GET skill detail. Implement ordered units,
all four skill states, crowns/progress, persistent learner top bar, available/in-progress skill
navigation, locked inert behaviour with explanation, and /skill/[skillId] start/resume actions.

POST start must navigate using returned attempt_id. Use backend values only. Reuse approved UI
primitives; do not redesign the system.
```

**Exit checks:**

- Seeded path shows completed/in-progress/available/locked correctly.
- Locked skills cannot start.
- Start/resume navigates to `/lesson/[attemptId]`.
- Top-bar values match API after refresh.
- Loading/error/retry states work.

---

## Phase 9B — Learning-path visual composition

**Model:** **Opus**

**Skill:** `frontend-design`

**Load:**

- Implemented path/skill files only
- `/frontend/design-system.md`
- Requirements R-01, R-14 and responsive bonus
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 9B using Opus and frontend-design: polish the real learning path and skill
start screens without changing API behaviour.

Follow the Common phase protocol. Create a distinctive winding path, strong unit hierarchy,
tactile nodes, clear state differentiation, progress/crown readability, balanced desktop width,
and excellent mobile flow. Use original LingoQuest visuals and approved primitives.

Run the app and judge rendered screenshots at mobile, tablet, and desktop sizes. Fix visual and
interaction issues you can verify. Do not modify backend contracts.
```

**Exit checks:**

- Functional checks from 9A still pass.
- Screenshots show consistent hierarchy and no overflow/clipping.
- States are distinguishable without colour alone.
- No real Duolingo asset/copy is present.

---

## Phase 10A — Lesson attempt state and shell

**Model:** Sonnet

**Load:**

- Lesson attempt/answer/complete sections of `/docs/03_API_SPEC.md`
- State ownership and lifecycle from `/docs/01_ARCHITECTURE.md`
- `/frontend/design-system.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 10A: functional lesson attempt shell.

Follow the Common phase protocol. On /lesson/[attemptId], retrieve the attempt from the backend,
render the current persisted index, progress, hearts and safe terminal states, and create the
answer -> feedback -> continue -> next -> complete state machine.

Handle refresh/direct navigation, duplicate-click prevention, request errors, failed status,
completion result, exit confirmation, and retry after refill. Do not implement the five exercise
widgets in this subphase beyond a typed renderer boundary.
```

**Exit checks:**

- Refresh resumes from backend index.
- Terminal attempts never enter active loop.
- Submit/continue cannot double-fire.
- Progress/hearts use response values.
- Typed renderer rejects unknown exercise type safely.

---

## Phase 10B — Five exercise components

**Model:** Sonnet

**Load:**

- Public exercise contracts and answer endpoint from `/docs/03_API_SPEC.md`
- `/frontend/design-system.md`
- Approved UI primitives
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 10B: implement all five real exercise components.

Follow the Common phase protocol. Build dedicated multiple-choice, word-bank, match-pairs,
fill-blank, and type-answer interactions matching the exact JSON contracts. Each component owns
only transient selection/text and returns a typed answer to the lesson shell.

Implement keyboard/touch behaviour, answer readiness, reset on exercise change, and clear
selected/paired states. Do not calculate correctness or hearts locally.
```

**Exit checks:**

- Component tests cover each interaction and submitted payload.
- All five work against seeded real API attempts.
- Match/word-bank prevent invalid duplicates.
- Text forms have labels, Enter behaviour and safe validation.
- No generic text-field fallback exists.

---

## Phase 10C — Lesson feedback, failure, and results visual pass

**Model:** **Opus**

**Skill:** `frontend-design`

**Load:**

- Implemented lesson components only
- `/frontend/design-system.md`
- Relevant result/error response examples from API spec
- Requirements R-03, R-04, R-05, R-16
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 10C using Opus and frontend-design: polish the working lesson experience.

Follow the Common phase protocol. Improve the player shell, exercise composition, progress,
correct/incorrect FeedbackSheet, heart-loss feedback, zero-heart modal, refill state, completion
results, XP/streak/crown/achievement reveals, and reduced-motion alternatives.

Use purposeful tactile 3D motion and original LingoQuest language. Preserve the tested state
machine and backend contracts. Inspect rendered screenshots and full interactions, not source code
alone.
```

**Exit checks:**

- Full success/failure/refill flows still pass.
- Correct and incorrect states are immediate and unambiguous.
- Feedback/action remains reachable on mobile.
- Results display only backend-returned values.
- Motion does not block, delay, or duplicate requests.

---

## Phase 10D — Exercise audio and TTS frontend

**Model:** Sonnet

**Load:**

- Audio requirements from `/docs/00_REQUIREMENTS_TRACEABILITY.md` R-13
- Exercise schema with tts_text/tts_lang from `/docs/02_DATABASE_SCHEMA.md`
- `/frontend/design-system.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 10D: exercise audio playback and TTS.

Follow the Common phase protocol. Implement accessible Play/Replay button that uses browser
speechSynthesis API when tts_text/tts_lang are present, or plays audio_url when available. Prefer
audio_url over TTS. Never autoplay.

Show honest disabled/unavailable state when speechSynthesis is unsupported. Add component tests
mocking speechSynthesis and verifying text/language selection. Update content-admin forms to expose
optional tts_text and tts_lang fields. Do not use or copy Duolingo audio.
```

**Exit checks:**

- Play/Replay buttons are keyboard accessible and labeled.
- Browser speechSynthesis works with seeded tts_text/tts_lang.
- audio_url takes precedence over TTS when present.
- Unsupported speech shows clear unavailable state.
- Component tests mock speechSynthesis and pass.
- Content-admin can create/edit TTS fields.
- No console errors during playback.

---

## Phase 10E — Timed-practice frontend flow

**Model:** Sonnet

**Load:**

- Timed-practice requirements from `/docs/00_REQUIREMENTS_TRACEABILITY.md` R-14
- Timed-mode API contracts from `/docs/03_API_SPEC.md`
- `/frontend/design-system.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 10E: timed-practice frontend flow.

Follow the Common phase protocol. Add timed-practice start option on unlocked skill screen. Display
countdown timer using backend remaining_seconds. Handle time-expired failure modal. Show timed
completion results with fixed 20 XP. Support refresh/resume with timer recovery. Implement
reduced-motion alternative for timer. Label as "Timed Practice."

Preserve standard-mode lesson shell. Do not consume normal hearts display in timed mode.
```

**Exit checks:**

- Timed start creates timed attempt with 120-second countdown.
- Timer updates from backend remaining_seconds.
- Expired attempts show time-expired failure modal.
- Successful timed completion shows 20 XP result.
- Refresh/resume recovers timer state.
- Reduced-motion timer alternative works.
- Standard mode remains unaffected.

---

## Phase 11A — Profile, leaderboard, achievements, and settings

**Model:** Sonnet

**Load:**

- User, Leaderboard, Achievements sections of API spec
- `/frontend/design-system.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 11A: required secondary learner screens.

Follow the Common phase protocol. Build profile statistics/achievement states, total-XP
leaderboard with current-user highlight, and settings with working display-name/daily-goal edit.
Use shared primitives and real endpoints.

Represent subscription, friends, pronunciation, and additional languages only as clearly disabled
Coming Soon/Demo Only information. Do not create clickable no-op actions or 501 calls.
```

**Exit checks:**

- Profile values agree with API and seed.
- Leaderboard order/current rank update after XP.
- Daily-goal edit persists and updates progress.
- Earned/locked achievement states are accessible.
- Placeholder cards are honest and inert.

---

## Phase 11B — Content manager

**Model:** Sonnet

**Load:**

- Content administration section of API spec
- Exercise contracts section of API spec
- `/frontend/design-system.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 11B: minimal real content manager at /admin/content.

Follow the Common phase protocol. Build course tree browsing and create/edit/deactivate exercise
forms for all five types. Use type-specific fields or a safe structured editor with clear
validation; never expose admin answers in learner UI.

Handle forbidden, order conflict, invalid contract, and active-attempt conflict responses. Keep
the admin screen visually consistent but prioritise correctness and edit clarity.
```

**Exit checks:**

- Existing content browses in deterministic order.
- Valid create/edit/deactivate persists and appears after refresh.
- Invalid type contracts cannot save.
- Active-attempt edits show a clear conflict.
- Learner endpoints still redact answers.

---

## Phase 12 — Required-feature end-to-end gate

**Model:** Sonnet

**Load:**

- `/docs/00_REQUIREMENTS_TRACEABILITY.md`
- `/docs/08_TESTING_ACCEPTANCE.md`
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 12: required-feature acceptance gate.

Follow the Common phase protocol. Run every MUST acceptance workflow against the real frontend,
backend and seeded SQLite database. Add/fix automated tests and manually verify browser flows at
desktop and mobile baseline.

Build a requirement-to-evidence table in the handoff. Fix in-scope failures one category at a
time. Do not start optional bonuses while any MUST item is red.
```

**Exit checks:**

- R-01 through R-15 are green or an explicit external deployment blocker is recorded.
- Full lesson success, failure, refill and refresh flows pass.
- No fake counters/buttons, console errors, failed network requests, leaked answers, or TODOs.
- Typecheck, lint, backend tests, frontend tests and production builds pass.

---

## Phase 13 — Responsive design and dark mode bonuses

**Model:** Sonnet for implementation; use Opus only for unresolved visual judgment.

**Skill:** `ui-ux-pro-max` for the dedicated responsive/accessibility audit.

**Load:**

- Committed bonus criteria from requirements
- `/frontend/design-system.md`
- Relevant frontend files
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 13: committed responsive and dark-mode bonuses.

Follow the Common phase protocol. Use ui-ux-pro-max for the audit. Fix every core screen at 360px,
768px and 1280px+ widths, including long text, keyboard focus, dialogs, feedback bars and content
forms. Implement class-based dark mode using semantic tokens and persist theme in the UI store.

Do not change backend behaviour or introduce one-off screen colours outside the token system.
```

**Exit checks:**

- No overflow, clipping, unreachable action or unusable touch target.
- Both themes cover every core state with readable contrast.
- Theme persists locally without storing learner progress.
- Reduced-motion and keyboard flows remain intact.

---

## Phase 14 — Final visual QA

**Model:** **Opus**

**Skill:** `frontend-design`

**Load:**

- `/frontend/design-system.md`
- Requirements R-13 through R-17 and responsive bonus
- Real screenshots at mobile, tablet, and desktop
- Handoff

**Prompt:**

```text
Perform LingoQuest Phase 14 using Opus and frontend-design: final visual QA and polish.

Follow the Common phase protocol. Run the real app and review screenshots/interactions for every
required screen in light and dark themes at target viewports. Include audio Play/Replay states,
timed-practice timer, XP/streak/achievement toasts, and original mascot-style flourishes. Fix
hierarchy, spacing, typography, depth consistency, pressed states, awkward empty/error/loading
states, motion, overflow, and visual accessibility.

Preserve all tested functionality and API contracts. Do not add new features, dependencies, real
Duolingo assets, or a wholesale redesign. This is a refinement pass.
```

**Exit checks:**

- Screenshot matrix includes audio, timer, toasts, and mascot states.
- Shared primitives remain consistent.
- Required end-to-end gate remains green.
- Production frontend build passes after polish.

---

## Phase 15 — README and deployment

**Model:** Sonnet; fast model may format already-verified tables only.

**Load:**

- `/docs/01_ARCHITECTURE.md` — verified architecture only
- `/docs/09_DEPLOYMENT.md`
- Handoff commands/results
- Actual environment examples/package manifests

**Prompt:**

```text
Perform LingoQuest Phase 15: README, deployment and submission evidence.

Follow the Common phase protocol. Write README from verified repository facts: exact setup,
migrate, seed, run, test and build commands; stack; architecture; database relationships; API
overview; assumptions/deviations; screenshots; and hosted link.

Deploy according to /docs/09_DEPLOYMENT.md with persistent SQLite storage, explicit origins,
migrations and seed. Run hosted smoke tests. Do not claim any command or URL that was not verified.
```

**Exit checks:**

- Fresh-clone setup works from README alone.
- Public repository contains required source/docs/tests but no secrets/database/build outputs.
- Hosted frontend/backend/SQLite persistence work.
- Hosted path -> lesson -> completion -> refresh smoke flow passes.
- Debug endpoints are disabled or explicitly safe/documented.

---

## Phase 16 — Final submission audit

**Model:** Sonnet

**Load:**

- `/docs/00_REQUIREMENTS_TRACEABILITY.md`
- `/docs/08_TESTING_ACCEPTANCE.md`
- `/docs/09_DEPLOYMENT.md`
- Final handoff

**Prompt:**

```text
Perform LingoQuest Phase 16: final submission audit only.

Follow the Common phase protocol. Re-run required automated tests/builds, hosted smoke tests, link
checks, secret/tracked-artifact scan, migration/seed verification, and the complete requirement
traceability checklist. Inspect final git diff for accidental debug code, stubs, copied assets,
broken buttons, TODOs and documentation claims that are not true.

Fix only submission blockers and regressions. Produce a final evidence summary in the handoff.
```

**Exit checks:**

- Every requirement has current evidence.
- Repository and hosted demo are accessible.
- No secret or local database is tracked.
- All tests/builds and critical hosted flows pass.
- Handoff states `SUBMISSION READY` only when genuinely true.

## Stop conditions

Stop and report rather than guessing when:

- The assignment and requirements document materially conflict.
- A migration would destroy existing user data.
- Required credentials/hosting authority are missing.
- An installed GitHub skill instructs copying protected assets or violates project rules.
- Existing unrelated user changes overlap the same code and cannot be preserved safely.

A blocker does not authorize skipping the requirement or replacing it with a fake implementation.