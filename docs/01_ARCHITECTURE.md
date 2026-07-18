# LingoQuest — Architecture

## Architectural goals

The architecture must make the assignment's core workflows correct, testable, and easy to
explain in an interview.

Priorities, in order:

1. A reliable persisted lesson loop with no refresh or navigation dead ends.
2. One backend authority for hearts, XP, streaks, crowns, goals, achievements, and unlocks.
3. Clear service boundaries and thin HTTP routers.
4. A normalized SQLite schema managed through migrations.
5. A reusable frontend design system rather than screen-specific styling.
6. A setup and deployment path that an evaluator can reproduce.

All implementation must satisfy `/docs/00_REQUIREMENTS_TRACEABILITY.md`.

## Technology decisions

### Frontend

- **Next.js App Router + TypeScript:** routing, layouts, and production build.
- **Tailwind CSS:** design tokens, responsive layouts, dark mode, and component styling.
- **Zustand:** UI-only state such as theme and transient modal preferences. It is not the source
  of truth for learner progress.
- **Motion for React:** purposeful feedback, progress, node, and celebration animations.
- **Typed fetch client:** one API wrapper that normalizes JSON parsing and error handling.

Use the stable versions installed by the scaffold rather than hard-coding a framework version in
project instructions. Keep TypeScript strict mode enabled.

### Backend

- **FastAPI:** typed HTTP endpoints and generated OpenAPI documentation.
- **Pydantic:** request, response, and exercise-content validation.
- **SQLAlchemy 2.0 async:** explicit persistence and transaction boundaries.
- **Alembic:** versioned schema changes. Runtime `create_all()` is not the migration strategy.
- **aiosqlite + SQLite:** assignment database with asynchronous SQLAlchemy integration.
- **pytest:** unit and API integration testing.

### Why FastAPI instead of Django

The assignment needs a compact API with strongly defined JSON contracts and independently
testable services. FastAPI and Pydantic provide those contracts with less framework setup, while
SQLAlchemy and Alembic still demonstrate deliberate database design.

### Why CSS-based 3D instead of WebGL

LingoQuest's depth comes from reusable layers, bottom edges, shadows, pressed translation, colour,
and motion. Three.js/WebGL would add bundle weight and implementation risk without improving the
required learning workflows.

## Repository layout

```text
/
├── .cursor/
│   └── rules/
│       └── project-rules.mdc
├── .claude/
│   └── skills/
│       ├── ui-ux-pro-max/
│       │   └── SKILL.md
│       └── frontend-design/
│           └── SKILL.md
├── docs/
│   ├── 00_REQUIREMENTS_TRACEABILITY.md
│   ├── 00_MASTER.md
│   ├── 01_ARCHITECTURE.md
│   ├── 02_DATABASE_SCHEMA.md
│   ├── 03_API_SPEC.md
│   ├── 04_GAMIFICATION_LOGIC.md
│   ├── 05_SEED_DATA.md
│   ├── 06_IMPLEMENTATION_PHASES.md
│   ├── 07_HANDOFF_CURRENT_STATE.md
│   ├── 08_TESTING_ACCEPTANCE.md
│   └── 09_DEPLOYMENT.md
├── frontend/
├── backend/
├── .gitignore
├── README.md
└── CLAUDE.md                         # optional: only for actual Claude Code
```

### Frontend layout

```text
/frontend
├── app/
│   ├── layout.tsx                    # providers, font, theme, app shell
│   ├── page.tsx                      # learning path `/`
│   ├── skill/[skillId]/page.tsx      # skill detail and start/resume action
│   ├── lesson/[attemptId]/page.tsx   # persisted lesson attempt player
│   ├── profile/page.tsx
│   ├── leaderboard/page.tsx
│   ├── settings/page.tsx
│   ├── admin/content/page.tsx        # minimal content manager
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── app-shell/                    # header, navigation, page container
│   ├── path/                         # unit banner, path, skill node, progress ring
│   ├── lesson/                       # player shell, progress, feedback, results
│   │   └── exercises/                # one component per exercise type
│   ├── gamification/                 # hearts, streak, XP/goal, gems, crowns
│   ├── profile/
│   ├── leaderboard/
│   ├── admin/
│   └── ui/                           # shared 3D primitives and accessible controls
├── lib/
│   ├── api/
│   │   ├── client.ts                 # base URL, fetch, JSON and ApiError handling
│   │   ├── course.ts
│   │   ├── lessons.ts
│   │   ├── user.ts
│   │   └── content.ts
│   ├── contracts/                    # TypeScript types matching API responses
│   ├── utils/
│   └── constants.ts
├── stores/
│   └── ui-store.ts                   # theme and UI preferences only
├── tests/
│   ├── components/
│   └── e2e/
├── public/                            # original local assets only
├── .env.example
└── package.json
```

Do not store authoritative hearts, XP, streak, crowns, lock state, or attempt progress in a
persisted Zustand store. The lesson page restores state from the attempt API.

### Backend layout

```text
/backend
├── alembic/
│   └── versions/
├── app/
│   ├── main.py                       # app factory, middleware, routers, handlers
│   ├── core/
│   │   ├── config.py                 # validated environment configuration
│   │   ├── database.py               # engine, async session, SQLite FK pragma
│   │   ├── clock.py                  # real/debug logical clock abstraction
│   │   └── errors.py                 # domain errors and response mapping
│   ├── dependencies/
│   │   ├── auth.py                   # get_current_user()
│   │   └── admin.py                  # require_content_admin()
│   ├── models/
│   │   ├── course.py
│   │   ├── user.py
│   │   ├── progress.py
│   │   └── achievement.py
│   ├── schemas/
│   │   ├── common.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── user.py
│   │   ├── leaderboard.py
│   │   └── content.py
│   ├── routers/
│   │   ├── health.py
│   │   ├── course.py
│   │   ├── lessons.py
│   │   ├── user.py
│   │   ├── leaderboard.py
│   │   ├── achievements.py
│   │   ├── content_admin.py
│   │   └── debug.py
│   ├── services/
│   │   ├── course_path.py
│   │   ├── lesson_engine.py
│   │   ├── answer_grading.py
│   │   ├── hearts.py
│   │   ├── xp.py
│   │   ├── streak.py
│   │   ├── skill_progress.py
│   │   ├── achievements.py
│   │   ├── leaderboard.py
│   │   ├── profile.py
│   │   └── content_admin.py
│   └── seed/
│       ├── content.py
│       └── seed_data.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── .env.example
├── alembic.ini
└── pyproject.toml
```

## Layer responsibilities

### Routers

Routers own HTTP concerns only:

1. Parse path, query, and body input through Pydantic.
2. Resolve the current user and database session through dependencies.
3. Call one service operation.
4. Return the declared response model.

Routers must not calculate streaks, grade answers, deduct hearts, award XP, derive unlocks, or
edit ORM objects directly beyond passing them to services.

### Services

Services own application behaviour and transactions:

- Starting, resuming, answering, failing, and completing attempts.
- Exercise grading and normalized string comparison.
- Heart regeneration and refill.
- XP, daily-goal, streak, crown, unlock, and achievement rules.
- Profile and leaderboard aggregation.
- Content validation and content-management operations.

Services raise typed domain errors. They do not construct FastAPI `HTTPException` objects.

### Schemas

Pydantic schemas are the runtime API contract:

- Separate request, public response, and internal content models where answers must be hidden.
- Use discriminated exercise schemas or explicit per-type validation.
- Never serialize an ORM exercise directly to a learner response because it contains
  `correct_answer`.
- Response models must match `/docs/03_API_SPEC.md` exactly.

### Models

SQLAlchemy models define persistence only. Domain calculations stay in services. Database-level
foreign keys, unique constraints, checks, and indexes back important invariants where practical.

## State ownership

| State | Authority | Frontend responsibility |
|---|---|---|
| Hearts and regeneration | Backend hearts service + SQLite | Render latest response; show countdown |
| Total/today XP and daily goal | Backend XP/profile services + SQLite | Render returned totals/progress |
| Current/longest streak | Backend streak service + SQLite | Render returned streak |
| Crowns and unlock state | Backend skill-progress service + SQLite | Render course response |
| Attempt status/index/order | Backend lesson engine + SQLite | Render current exercise and transient input |
| Correct answer | Backend grading service | Reveal only after answer response |
| Achievements | Backend achievement service + SQLite | Render earned/locked/unlocked states |
| Theme | Frontend UI store/local storage | Apply light/dark class |
| Selected word tiles/pairs/text | Current exercise component | Reset when exercise changes |
| Feedback animation visibility | Lesson component | Follow the submitted answer response |

Optimistic UI is allowed only for reversible presentation such as button press, tile selection,
or a loading transition. Do not optimistically deduct hearts or award XP/crowns.

## Lesson-attempt lifecycle

The lesson attempt is the central state machine.

```text
skill page
  -> POST start
      -> return matching in-progress attempt, or
      -> create a new in-progress attempt
  -> navigate to /lesson/[attemptId]
  -> GET attempt on page load/refresh
  -> submit expected current exercise
      -> correct/incorrect feedback
      -> advance persisted current_index, or
      -> fail immediately when hearts reach zero
  -> POST complete after every exercise is answered
      -> atomic gamification update
      -> completed results
```

### Start/resume rules

- Reject normal lesson start when the learner has zero hearts.
- If the learner already has an `in_progress` attempt for the selected skill, return it with
  `resumed: true` instead of creating duplicate active work.
- Otherwise choose the lesson pool, persist a randomized exercise order, and return the attempt.
- Public start/resume payloads never expose correct answers.

### Answer rules

- Confirm the attempt belongs to the current learner and is `in_progress`.
- Confirm `exercise_id` equals the exercise at `current_index` and belongs to
  `exercise_order`.
- Reject duplicate or out-of-order answers before grading or deducting hearts.
- Validate the answer shape for the exercise type.
- Grade, write the answer audit row, update mistakes/hearts/index, and possibly fail the attempt
  in one transaction.
- Return the authoritative index, hearts, status, correctness, and revealed solution.

### Completion rules

- Completion is allowed only when the attempt is `in_progress`, hearts are above zero, and
  `current_index == total_exercises`.
- XP, streak, crowns, unlock effects, achievements, and completion timestamp update in one
  transaction.
- A second completion request returns a conflict and cannot award anything twice.

## Progress-state derivation

There must be one authoritative `derive_skill_state()` service used by both the course response
and skill-detail response.

Derive the public state as follows:

1. `completed` when crowns have reached `max_level`.
2. `in_progress` when crowns are above zero or a matching active attempt exists.
3. `available` when the prerequisite requirement is satisfied.
4. `locked` otherwise.

Do not independently store and mutate the same public state in several places. The database
schema document defines which progress facts are persisted and which state is derived.

## Transaction boundaries and idempotency

The following operations require explicit transaction boundaries:

- Start/resume attempt lookup and creation.
- Answer logging, heart deduction, index advancement, and failure.
- Completion plus all gamification effects.
- Achievement insertion.
- Content create/update validation and persistence.

Every completion path must be idempotent at the data level, not merely disabled in the UI.
Database constraints support service checks, but service errors must still be understandable.

SQLite has limited write concurrency; keep transactions short and never hold a transaction open
while waiting for frontend input or external I/O.

## Time and date architecture

All stored timestamps are timezone-aware UTC. Game-day calculations use one injected logical
clock from `app/core/clock.py`.

- Production clock returns the real current UTC date/time.
- Tests inject fixed dates/times.
- A development-only clock may apply a persisted or process-local offset for demonstration.
- Debug time routes are registered only when `DEBUG_TIME_TRAVEL=true`.
- Streak, daily XP, and heart regeneration use the same clock.

Do not call `datetime.now()` or `date.today()` directly inside gamification services.

## Authentication and content-admin boundary

Authentication is simplified, but identity is not hardcoded throughout the app.

- `get_current_user()` is the only default-user resolver.
- All learner queries are scoped to that user.
- The seeded default learner may be marked as a content admin for the assignment demo.
- `/api/admin/content/*` uses `require_content_admin()` so real authentication can replace the
  demo resolver without rewriting content services.
- The learner UI and content-management UI remain separate.

## API error architecture

Services raise domain errors such as:

- `NotFoundError`
- `OutOfHeartsError`
- `AttemptConflictError`
- `InvalidAnswerError`
- `ContentValidationError`
- `ForbiddenError`

Central FastAPI exception handlers map them to the standard API error response and real HTTP
status codes. Unexpected errors are logged and return a safe internal-error response without a
stack trace or secret value.

The frontend fetch client converts non-success responses into a typed `ApiError`. Pages and
components render deliberate loading, empty, retryable error, forbidden, and not-found states.

## Runtime configuration

Never commit real `.env` files. Commit `.env.example` files containing names and safe examples.

### Backend environment

```text
DATABASE_URL=sqlite+aiosqlite:///./LingoQuest.db
FRONTEND_ORIGINS=http://localhost:3000
DEFAULT_USER_USERNAME=demo_learner
DEBUG_TIME_TRAVEL=false
```

Parse `FRONTEND_ORIGINS` as an explicit allowlist. Do not use wildcard origins with credentials.

### Frontend environment

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

The typed API client is the only location that reads this variable. Feature components do not
construct backend origins manually.

## SQLite rules

- Enable `PRAGMA foreign_keys=ON` on every connection.
- Use Alembic for schema creation and changes.
- Do not commit the local `.db`, `-wal`, or `-shm` files.
- Use deterministic ordering whenever results can tie.
- Store timestamps consistently and serialize them as ISO 8601.
- Production hosting must use a persistent filesystem/volume for the SQLite file.

## Seed and content-management boundary

The seed system creates a deterministic, immediately demonstrable application. It is not a
frontend mock layer.

- Seed structured database content through `app.seed.seed_data`.
- Provide a documented reset/reseed workflow for local evaluation.
- Keep exercise content readable in `app/seed/content.py`.
- Validate seed exercises with the same rules used by content-management APIs.
- Keep learner history consistent with seeded totals and achievements.

The content manager operates on database content after seeding. It must not edit the Python seed
file at runtime.

## Frontend design architecture

Cursor loads project skills from `.claude/skills/` for compatibility, so the existing GitHub
skills do not need to be moved. Every skill folder must contain its own `SKILL.md`. Use the exact
folder name `frontend-design`; if the downloaded folder is accidentally named `fronted-design`,
rename the folder so prompts and documentation remain unambiguous.

The skills have separate responsibilities:

| Skill | Responsibility | When to load |
|---|---|---|
| `ui-ux-pro-max` | UX planning, information hierarchy, typography, colour-system review, responsive behaviour, accessibility, and usability critique | At the start of a new screen family or during a dedicated UX audit |
| `frontend-design` | Distinctive visual composition, production-quality component styling, layout implementation, and avoiding generic AI-generated UI | When implementing or substantially redesigning frontend screens |

The two GitHub skills guide the design process, while this architecture document and the approved
LingoQuest design-system implementation provide the project-specific contract. If suggestions
conflict, use this priority:

1. Assignment requirements and API behaviour.
2. Approved LingoQuest design tokens, shared primitives, and architecture rules.
3. `frontend-design` implementation guidance.
4. `ui-ux-pro-max` general recommendations.

Accessibility requirements cannot be overridden by a visual styling instruction.

Do not load every design skill for every small edit. Use this staged workflow to control context
and avoid conflicting instructions:

1. **Plan with Opus + `ui-ux-pro-max`:** define hierarchy, responsive layout, states, and UX
   risks for a screen family.
2. **Establish visuals with Opus + `frontend-design`:** decide composition, approved LingoQuest
   tokens, primitives, tactile depth, typography, and motion.
3. **Implement routine variants with Sonnet:** connect APIs and reuse the approved primitives
   without redesigning them.
4. **Verify with `/docs/08_TESTING_ACCEPTANCE.md`:** inspect the rendered result and fix every
   responsive, accessibility, interaction, console, network, and visual-consistency issue.
5. **Perform the final visual pass with Opus + `frontend-design`:** use screenshots at target
   viewports, not source
   code alone.

The design-system phase must record the approved LingoQuest visual tokens and interaction patterns
in the frontend theme/styles and shared primitives. Implement them through reusable components,
for example:

- `Button3D`
- `IconButton3D`
- `Card3D`
- `SkillNode3D`
- `ProgressBar`
- `ProgressRing`
- `FeedbackSheet`
- `Modal3D`
- `StatPill`

Screens compose these primitives; they do not duplicate shadow and pressed-state CSS.

The first frontend design phase uses Opus to establish the system with the installed skills.
Sonnet then performs routine wiring and repeated implementation. The final Opus pass reviews real
screenshots rather than guessing about rendered output.

## Accessibility and responsive baseline

Even when responsive design is treated as a committed bonus, new components must not block it.

- Use semantic buttons, headings, forms, labels, lists, and dialogs.
- Every interaction must work by keyboard and show a visible focus state.
- Do not communicate correctness or lock state by colour alone.
- Honour reduced-motion preferences for nonessential animation.
- Touch targets should be comfortably usable on mobile.
- Dialogs trap focus, close intentionally, and restore focus to their trigger.
- Test core flows at mobile, tablet, and desktop widths before submission.

## Testing architecture

### Backend unit tests

Test pure/domain rules independently:

- All five answer graders and malformed answer shapes.
- Same-day, next-day, and broken streaks.
- Heart loss, regeneration, cap, and timer remainder.
- XP bonus and completion idempotency.
- Crown caps, unlock derivation, and achievement idempotency.

### Backend integration tests

Use a temporary SQLite database with migrations/schema parity to test:

- Start/resume/refresh/answer/fail/complete lifecycle.
- User ownership and conflict responses.
- Course, profile, leaderboard, and content-management endpoints.
- Transaction rollback when part of completion fails.

### Frontend and end-to-end tests

- Component tests cover the five exercise interactions and shared feedback states.
- At least one browser test completes a seeded lesson through the real backend.
- A failure test confirms wrong answers reduce hearts and zero hearts blocks completion.
- Manual QA covers responsive layout, keyboard access, animation, console, and network errors.

The exact acceptance suite lives in `/docs/08_TESTING_ACCEPTANCE.md`.

## Deployment architecture

Frontend and backend may deploy separately, provided:

- The frontend API base URL points to the deployed backend.
- Backend CORS allows only the deployed frontend and documented local origins.
- The backend SQLite database uses persistent storage.
- Migrations and seed operations are explicit deployment steps and safe to repeat as documented.
- `/api/health` verifies that the process is alive; a readiness check also confirms database
  access.
- Debug time travel is disabled unless the hosted demo intentionally enables a safe demo mode.

Deployment provider details and smoke tests belong in `/docs/09_DEPLOYMENT.md`, not in this
architecture file.

## Architecture invariants

Claude must preserve all of these during implementation:

1. Backend services own business rules; routers remain thin.
2. Backend responses own persisted learner state; frontend stores do not replace them.
3. Learner exercise payloads never reveal answers before submission.
4. Attempt refresh/resume works from the URL alone.
5. Answer and completion operations reject duplicates and invalid order.
6. All completion gamification updates are atomic.
7. Public skill state has one derivation implementation.
8. Exercise contracts are identical across seed validation, admin validation, grading, API, and
   frontend TypeScript types.
9. Database changes use Alembic and SQLite foreign keys are enabled.
10. Every visible required action works; allowed placeholders are visibly disabled and honest.
11. Original LingoQuest assets and shared 3D primitives are used throughout the UI.
12. Current progress belongs only in the handoff document, never in permanent architecture.