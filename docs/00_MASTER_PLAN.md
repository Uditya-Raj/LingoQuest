# LingoQuest — Master Delivery Plan

## Purpose

LingoQuest is an original language-learning web application built for the Duolingo-clone
assignment. It recreates the required learning-path, lesson, and gamification experience using
original branding and implementation.

Technology baseline:

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, Zustand, and Motion.
- Backend: FastAPI, Pydantic, SQLAlchemy 2.0 async, and Alembic.
- Database: SQLite.
- Content: one seeded Spanish-from-English course.
- Authentication: one default seeded learner resolved through a replaceable backend dependency.

The goal is not to match Duolingo's production feature count. The goal is to submit a complete,
internally consistent, polished application in which every required visible feature works.

## Product identity

- Public product name: **LingoQuest**.
- Use original wordmarks, icons, illustrations, mascot treatment, writing, and sounds.
- Do not download, trace, bundle, or reference real Duolingo brand assets.
- “Duolingo clone” may appear in assignment documentation, but not as the public product name.

## Source-of-truth hierarchy

Before making a decision, use the priority order defined in
`/docs/00_REQUIREMENTS_TRACEABILITY.md`.

In short:

1. Original assignment.
2. Requirements and acceptance criteria.
3. API, database, and gamification contracts.
4. Architecture.
5. Current-state handoff for progress only.
6. Existing implementation.

`/docs/07_HANDOFF_CURRENT_STATE.md` is the only document allowed to say which phase is currently
complete or what should be worked on next. Do not put temporary progress such as “backend is
done” or “start at Phase 6” in permanent rules or specification files.

## Required-first delivery policy

Every MUST requirement in `/docs/00_REQUIREMENTS_TRACEABILITY.md` must be implemented and verified
before optional scope is started.

Required features include:

- Learning path with backend-derived lock/unlock states and crown progress.
- A reliable skill-start, lesson-attempt, refresh, and resume flow.
- All five playable exercise types.
- Immediate answer feedback and a complete lesson results flow.
- Persisted hearts, failure, regeneration, and refill.
- Persisted XP, daily goal, streak, crowns, and achievements.
- Seeded total-XP leaderboard with current-learner ranking.
- Learner profile with real persisted statistics.
- Structured course content and minimal working content management.
- Original polished UI with no fake counters or misleading controls.
- Tests, documentation, public repository, and hosted demo.

Committed bonuses are responsive design, dark mode, and enhanced achievement presentation. They
remain behind the required-feature gate.

## Repository document set

Store these files under `/docs` using the exact names below:

| File | Responsibility |
|---|---|
| `00_REQUIREMENTS_TRACEABILITY.md` | Assignment scope, acceptance criteria, and definition of done |
| `00_MASTER.md` | Delivery strategy, context policy, model routing, and document map |
| `01_ARCHITECTURE.md` | Technology decisions, repository layout, state ownership, and runtime boundaries |
| `02_DATABASE_SCHEMA.md` | Tables, relationships, constraints, indexes, and persistence decisions |
| `03_API_SPEC.md` | Endpoints, request/response models, exercise contracts, and errors |
| `04_GAMIFICATION_LOGIC.md` | Hearts, XP, streak, crowns, achievements, and date rules |
| `05_SEED_DATA.md` | Deterministic demo content and consistent seeded learner history |
| `06_IMPLEMENTATION_PHASES.md` | Small implementation prompts, model choice, context list, and phase exit checks |
| `07_HANDOFF_CURRENT_STATE.md` | Current implementation state and next action; updated after every phase |
| `08_TESTING_ACCEPTANCE.md` | Unit, integration, end-to-end, responsive, and manual acceptance tests |
| `09_DEPLOYMENT.md` | Environment configuration, production build, hosted demo, and smoke checks |

Repository-level agent configuration:

| File | Responsibility |
|---|---|
| `.cursor/rules/project-rules.mdc` | Short, always-on Cursor rules |
| `.claude/skills/ui-ux-pro-max/SKILL.md` | UX planning, hierarchy, responsive, and accessibility guidance |
| `.claude/skills/frontend-design/SKILL.md` | High-quality visual composition and frontend implementation guidance |
| `CLAUDE.md` | Optional compatibility file only when actual Claude Code is also used |

Selecting a Claude model inside Cursor does not make `CLAUDE.md` the Cursor rule file. Cursor
Agent receives permanent instructions from `.cursor/rules/project-rules.mdc`. Cursor also loads
project skills from `.claude/skills/` for compatibility.

## How to use this document set in Cursor

Do not paste the complete assignment or all documents into one prompt. Cursor can read repository
files directly. Give each chat one bounded task and reference only the documents needed for it.

For every implementation task:

1. Start by reading `.cursor/rules/project-rules.mdc` and
   `/docs/07_HANDOFF_CURRENT_STATE.md`.
2. Read only the task-specific documents listed in
   `/docs/06_IMPLEMENTATION_PHASES.md`.
3. Inspect the existing code before proposing changes.
4. State a short implementation plan and identify any specification conflict.
5. Modify only the current phase's scope.
6. Run that phase's automated checks.
7. Run or manually verify its user flow before starting another phase.
8. Update `/docs/07_HANDOFF_CURRENT_STATE.md` with changes, verification, unresolved issues, and
   the exact next action.

Use a fresh Cursor chat when moving to a substantially different phase. A phase may span several
chats, and a chat may complete a small subphase. The boundary is verified work, not the number of
chat sessions.

## Context-budget policy

Permanent rules must stay short. Detailed procedures belong in specs or skills that are loaded
only when relevant.

Use this context map:

| Task | Documents/skills to load |
|---|---|
| Requirements or scope decision | `00_REQUIREMENTS_TRACEABILITY.md`, `07_HANDOFF_CURRENT_STATE.md` |
| Architecture decision | `00_REQUIREMENTS_TRACEABILITY.md`, `01_ARCHITECTURE.md`, handoff |
| Database model/migration | `01_ARCHITECTURE.md`, `02_DATABASE_SCHEMA.md`, handoff |
| Course/path API | `01_ARCHITECTURE.md`, `02_DATABASE_SCHEMA.md`, `03_API_SPEC.md`, handoff |
| Lesson/gamification API | `02_DATABASE_SCHEMA.md`, `03_API_SPEC.md`, `04_GAMIFICATION_LOGIC.md`, handoff |
| Seed data | `02_DATABASE_SCHEMA.md`, exercise contracts from `03_API_SPEC.md`, `05_SEED_DATA.md`, handoff |
| UX/design planning | Requirements, `ui-ux-pro-max` skill, relevant existing UI files, handoff |
| Design-system implementation | `frontend-design` skill, approved UX plan, handoff |
| Learning-path UI | Course/path section of API spec, `frontend-design` skill, handoff |
| Lesson-player logic | Lesson and exercise sections of API spec, gamification response contracts, handoff |
| Lesson-player visuals | `frontend-design` skill, implemented lesson components, handoff |
| Profile/leaderboard/settings | Relevant API sections, shared UI primitives, handoff |
| Content manager | Content-management API section, schema, existing admin files, handoff |
| Testing/QA | Requirements, `08_TESTING_ACCEPTANCE.md`, `ui-ux-pro-max` for a dedicated UX audit, handoff |
| Deployment/README | Architecture, `09_DEPLOYMENT.md`, verified commands, handoff |

When a document is long, reference the relevant heading rather than asking the model to reconsider
the entire file. Do not repeat full API schemas inside phase prompts; point to the authoritative
contract.

## Claude model-routing policy

Use the newest available model in each Claude tier rather than hard-coding a model version that
will become stale.

### Sonnet — default engineering model

Use Sonnet for most implementation work:

- Architecture and specification updates.
- Database models and migrations.
- FastAPI routers, schemas, and services.
- Frontend API integration and state wiring.
- Repetitive exercise-component implementation after the interaction contract is decided.
- Profile, leaderboard, settings, and content-management screens.
- Tests, debugging, and cross-layer fixes.
- Deployment configuration.

Sonnet is the default unless a task falls into the Opus or fast-model categories below.

### Opus — reserved for high-judgment frontend work

Use Opus deliberately for:

- Defining the LingoQuest design language and shared 3D primitives.
- Designing the learning path's composition, node rhythm, hierarchy, and responsive behaviour.
- Designing the lesson-player shell, feedback states, results experience, and motion language.
- Resolving difficult UI/UX problems that remain after Sonnet implementation.
- Reviewing screenshots of every viewport and performing the final visual-polish pass.

Do not spend Opus usage on seed dictionaries, CRUD boilerplate, straightforward API wiring,
formatting, or README tables.

### Haiku or Cursor fast model — mechanical, low-risk work

Use a fast model only for tightly bounded tasks such as:

- Formatting already-decided documentation.
- Renaming files or applying repetitive mechanical edits.
- Producing row-count reports.
- Updating README tables from verified facts.

Do not use the fast model for gamification logic, migrations, lesson state, security-sensitive
behaviour, or final visual decisions.

### Opus-efficient frontend sequence

For a high-quality frontend without wasting Opus usage:

1. **Opus:** define tokens, primitives, screen composition, interaction states, and motion rules.
2. **Sonnet:** connect APIs, implement repeated variants, handle state, and complete routine code.
3. **Opus:** review real screenshots and fix visual hierarchy, responsiveness, and polish.
4. **Sonnet:** run regression fixes and tests that do not require new design judgment.

## Implementation order

The detailed prompts and exit criteria live in `/docs/06_IMPLEMENTATION_PHASES.md`. The high-level
order is:

1. Lock requirements and specifications.
2. Scaffold the application if starting from an empty repository.
3. Implement schema, migrations, and deterministic seed data.
4. Implement and test the backend core lesson and gamification loop.
5. Audit the existing backend against the current specifications if backend code already exists.
6. Use Opus to establish the frontend design system and 3D primitives.
7. Build the learning path and skill-start flow.
8. Build the lesson player and all five exercise interactions.
9. Build profile, leaderboard, settings, achievements, and content management.
10. Run required-feature conformance and end-to-end tests.
11. Add committed responsive and dark-mode bonuses.
12. Use Opus for final screenshot-based visual QA.
13. Complete README, deployment, hosted smoke tests, and submission checks.

If the repository already contains completed work, do not rerun earlier phases blindly. Read the
handoff, perform the relevant conformance audit, fix only verified gaps, and continue from the
first incomplete acceptance criterion.

## UI strategy

“High-quality 3D frontend” means tactile interface depth, not a heavy 3D game engine.

Use:

- Layered shadows and bottom edges.
- Pressed-state translation and shadow reduction.
- Clear elevation hierarchy.
- Original SVG/icon treatments.
- Motion for answer feedback, node emphasis, progress, and celebration.
- Shared tokens and primitives instead of screen-specific approximations.

Avoid:

- Three.js or WebGL unless a later requirement genuinely needs a 3D scene.
- Large continuous animations that distract from lessons.
- Random gradients, excessive glassmorphism, or generic AI-dashboard styling.
- Exact Duolingo artwork, wording, or screen reproduction.
- A final “make everything 3D” rewrite after the screens are already built.

Create the design system before the first production frontend screen, then reuse it everywhere.

Use the installed skills in stages rather than loading every design skill for every edit:

1. `ui-ux-pro-max` plans hierarchy, responsiveness, states, and accessibility.
2. `frontend-design` establishes the approved LingoQuest visual system with Opus.
3. Sonnet wires APIs and implements repeated variants using the approved shared primitives.
4. `/docs/08_TESTING_ACCEPTANCE.md` controls rendered QA; `ui-ux-pro-max` may be invoked for the
   dedicated UX audit.

If generic skill guidance conflicts with project rules, assignment/API behaviour wins first,
followed by the approved LingoQuest design system, `frontend-design`, and then `ui-ux-pro-max`.
Accessibility cannot be overridden by a visual preference.

## Quality gates

Do not call a phase complete because files were generated. Completion requires evidence.

Every phase must finish with:

- Relevant tests passing.
- Relevant linting and type checking passing.
- Manual verification of the changed flow.
- No new console errors or failed network requests.
- No fake data introduced outside the documented seed system.
- No unresolved visible button, placeholder action, silent fallback, or TODO in the phase scope.
- Handoff updated with exact results and next work.

Do not stack multiple unverified phases. Bugs in schema, contracts, or lesson state become more
expensive when hidden beneath later UI work.

## What “better” means for this assignment

LingoQuest is better for evaluation when:

- Every required exercise is genuinely playable.
- Refreshing or revisiting a lesson never creates a dead end.
- Hearts, XP, streak, crowns, goals, profile, and leaderboard always agree.
- Seeded history is consistent with displayed achievements and statistics.
- The database and service boundaries are easy to defend in an interview.
- The visual system feels original, responsive, tactile, and consistent.
- Setup and hosted evaluation work without private knowledge from the developer.

Five polished, connected workflows are more valuable than many unfinished bonus features.