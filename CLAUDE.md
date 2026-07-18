# CLAUDE.md — LingoQuest Repository Instructions

## How this file is used

This file is the Claude-facing entry point for the repository.

- **Cursor:** persistent always-on instructions belong in
  `.cursor/rules/project-rules.mdc`. That rule must direct the agent to read this file and
  `/docs/07_HANDOFF_CURRENT_STATE.md`; do not assume choosing a Claude model makes Cursor load
  every Markdown file automatically.
- **Claude Code:** keep this file at the repository root for project-level guidance.

Do not duplicate this entire file in prompts. Start each task with a phase request from
`/docs/06_IMPLEMENTATION_PHASES.md`.

---

## Product

LingoQuest is an original language-learning web application inspired by the interaction quality
of modern learning products. It uses:

- Next.js App Router, strict TypeScript, Tailwind CSS, Zustand, and Motion for React.
- FastAPI, Pydantic, SQLAlchemy 2.0 async, Alembic, and SQLite.
- One simplified current learner, while preserving proper user-scoped database/service design.

The goal is not to reproduce Duolingo branding. The goal is a fully functional, polished,
original learning experience with a tactile 3D interface.

---

## Sources of truth

Use the documents for different kinds of truth:

| Concern | Source |
|---|---|
| Assignment requirements and completion evidence | `/docs/00_REQUIREMENTS_TRACEABILITY.md` |
| Scope and document map | `/docs/00_MASTER.md` |
| Architecture and ownership boundaries | `/docs/01_ARCHITECTURE.md` |
| Tables, fields, constraints, indexes, migrations | `/docs/02_DATABASE_SCHEMA.md` |
| Endpoints, response shapes, errors, exercise JSON | `/docs/03_API_SPEC.md` |
| Hearts, XP, streak, crowns, goals, achievements | `/docs/04_GAMIFICATION_LOGIC.md` |
| Demo content, user history, exact seed invariants | `/docs/05_SEED_DATA.md` |
| Phase prompts, model choice, and exit checks | `/docs/06_IMPLEMENTATION_PHASES.md` |
| What is actually implemented now | `/docs/07_HANDOFF_CURRENT_STATE.md` |
| Automated, browser, accessibility, and visual gates | `/docs/08_TESTING_ACCEPTANCE.md` |

Specifications describe required behavior. Only the handoff describes current implementation
status. Never use an old chat, README claim, generated filename, or this file to assert that a
feature is already complete.

If two documents materially conflict, stop and report the exact conflict with a proposed
resolution. Do not silently choose the easier interpretation.

---

## Complete required-feature checklist

Keep this checklist visible when choosing work and reviewing completeness. It prevents a required
feature from disappearing between phases, but it does not replace the exact contracts in the
source documents.

- **R-01 — Learning path and skill tree:** ordered units/skills; locked, available, in-progress,
  and completed states; backend-derived locks; crowns/progress; locked-node blocking; real skill
  start; persistent backend-fed hearts, streak, XP, gems, and daily-goal top bar.
- **R-02 — Lesson start, refresh, and resume:** skill ID starts or resumes at most one active
  attempt; route uses the real attempt ID; refresh restores persisted position/order; no hidden
  answers; completed/failed attempts cannot resume; zero hearts blocks normal start.
- **R-03 — Five playable exercise types:** multiple choice, ordered word bank, match pairs,
  fill blank, and typed answer each have a genuine interaction and exact validated request/data
  contract; duplicate/out-of-order answers cannot mutate twice.
- **R-04 — Complete lesson loop:** persisted progress bar; immediate accessible correct/incorrect
  feedback; backend-revealed solution; deliberate Continue step; early/duplicate completion
  blocked; real results for XP, streak, crowns, unlocks, and achievements; retry creates a new
  attempt.
- **R-05 — Hearts:** one persisted heart lost per valid wrong answer; zero-heart atomic failure
  with no XP; lazy 15-minute regeneration with remainder/cap; working confirmed 20-gem refill;
  honest failure actions with no fake practice button.
- **R-06 — XP and daily goal:** lesson-configured XP plus perfect bonus; award exactly once;
  consistent total/today XP; backend goal progress capped at one; persisted daily-goal editing.
- **R-07 — Streak:** completion-only updates; first/same/next/missed-day rules; nondecreasing
  longest streak; injectable clock; debug time control unavailable in production.
- **R-08 — Skill progress:** one crown per successful completion up to the cap; practice count;
  authoritative backend state derivation; prerequisite unlocks; path reflects completion
  immediately.
- **R-09 — Per-user persistence:** hearts, XP, streak, crowns, attempts, answers, goal, and
  achievements survive refresh/restart in SQLite; centralized current-user resolution; frontend
  is never the system of record; safe deterministic seed/reset.
- **R-10 — Leaderboard:** multiple seeded users ranked consistently by total XP with deterministic
  ties; current learner highlighted/ranked; persisted completion can update score/rank.
- **R-11 — Profile and achievements:** real display name, join date, XP, current/longest streak,
  completed skills, perfect lessons, and earned/locked achievements; atomic and idempotent
  achievement awards backed by history.
- **R-12 — Structured content management:** database-backed units, skills, lessons, and exercises;
  separate `/admin/content` browser/editor; create/edit all exercise contracts using shared
  validation; invalid content cannot report success; destructive deletion is not required.
- **R-13 — Honest placeholders:** only speech/pronunciation, payment/subscription, extended social,
  and additional-language features may be `Coming Soon`/`Demo Only`; placeholders are disabled or
  informational and never hide a required feature.
- **R-14 — Original polished 3D experience:** LingoQuest identity and original visual treatment;
  no protected Duolingo assets or exact copy; shared tactile primitives; complete hover, pressed,
  focus, disabled, loading, success, and error states; purposeful nonblocking motion.
- **R-15 — Reviewable delivery:** eventual public repository, exact README setup/migrate/seed/run/
  test/build instructions, architecture/schema/API decisions, clean tracked files, hosted seeded
  demo, and fresh-clone verification. Deployment is currently deferred and R-15 must remain open
  until the user authorizes and verifies that work.

### Committed bonuses after all MUST features pass

- **B-01 — Responsive design:** core flows pass at approximately 360px, 768px, and 1280px+ with no
  overflow, clipping, unreachable actions, or unusable targets.
- **B-02 — Dark mode:** locally persisted theme preference with readable, accessible states on
  every core screen; learner progress remains backend-owned.
- **B-03 — Enhanced achievement presentation:** original celebration plus accessible text
  fallback, driven only by real achievement data.

### Deferred scope

Do not implement production authentication, real speech scoring, payments/subscriptions, a friend
graph/social feed, multiple complete courses, timed/legendary mode, or heavy WebGL/Three.js scenes
unless the user explicitly expands scope after required and committed work is green.

For exact acceptance criteria, follow `/docs/00_REQUIREMENTS_TRACEABILITY.md` and
`/docs/08_TESTING_ACCEPTANCE.md`. Do not implement from this condensed checklist alone.

---

## Required session startup

At the beginning of every Cursor/Claude task:

1. Read `.cursor/rules/project-rules.mdc`.
2. Read `/docs/07_HANDOFF_CURRENT_STATE.md`.
3. Locate the requested phase/subphase in `/docs/06_IMPLEMENTATION_PHASES.md`.
4. Read only the documents/headings listed by that phase.
5. Inspect the relevant existing code and `git status` before editing.
6. If the requested work is already present, verify it instead of rebuilding it.
7. State a short implementation plan, then work only within the requested phase.

If the repository has not been inspected, begin with Phase 0. If someone reports that the backend
is complete but current evidence is missing, run Phases 7A, 7B, and 7C before frontend work.

Never begin a second phase in the same request unless the user explicitly changes the scope.

---

## Model routing and context budget

Use the newest available model in the selected Claude tier.

| Work | Preferred model |
|---|---|
| Repository audit, architecture, database, backend, API, tests, fixes | **Sonnet** |
| Routine frontend API wiring and variants of approved components | **Sonnet** |
| UX blueprint, visual system, major 3D composition, final visual QA | **Opus** |
| Mechanical formatting after facts are verified | **Haiku/fast**, optional |

Reserve Opus for visual judgment. The Opus-led phases in the implementation plan are:

- Phase 8B — UX blueprint.
- Phase 8C — 3D design system and primitives.
- Phase 9B — learning-path visual composition.
- Phase 10C — lesson feedback/results visual pass.
- Phase 14 — final screenshot-based visual QA.

Phase 13 may use Opus only when Sonnet cannot resolve a visual issue without redesign judgment.
Do not spend Opus context on migrations, seed dictionaries, CRUD boilerplate, routine API wiring,
test log formatting, or README tables.

To keep context focused, do not load all `/docs` files for every task. Always load the handoff;
then load only the current phase and the source contracts it names.

---

## Installed frontend skills

Exactly two project skills are assumed:

```text
.claude/skills/ui-ux-pro-max/SKILL.md
.claude/skills/frontend-design/SKILL.md
```

If the second folder was downloaded as `fronted-design`, rename it to `frontend-design` before
using these instructions.

### `ui-ux-pro-max`

Use for:

- Information hierarchy and learner flow.
- Responsive composition and screen-state planning.
- Form usability, accessibility, and interaction audits.
- Phase 8B and the Phase 13 responsive/accessibility audit.

### `frontend-design`

Use for:

- Original visual direction and production-quality frontend implementation.
- Tactile 3D tokens/primitives, typography, spacing, depth, and motion.
- Phase 8C, Phase 9B, Phase 10C, and Phase 14.

Read the selected skill's `SKILL.md` before frontend design work. Use a skill only when the phase
calls for it. Do not reference, invent, or wait for `duolingo-3d-ui`, `frontend-qa`, or any other
project skill.

Skill guidance is subordinate to assignment requirements, API behavior, accessibility, and the
approved LingoQuest design system. A skill cannot authorize copied assets, fake functionality, or
frontend-owned gamification state.

---

## Non-negotiable architecture rules

### Backend services own business rules

All grading, hearts, regeneration, refill, XP, daily goal, streak, crowns, lock derivation,
achievements, lesson completion, and leaderboard behavior belongs in `/backend/app/services/`.

Routers remain thin:

```text
parse/validate request -> resolve current user -> call service -> return typed response
```

Services raise domain errors. Central API exception handling maps them to the standard error
envelope and real HTTP status codes.

### Backend owns learner state

The backend and SQLite are the sole source of truth for:

- Hearts and regeneration anchor.
- Gems.
- XP and today's XP.
- Daily-goal progress.
- Current/longest streak.
- Crowns, practice count, and derived skill state.
- Lesson attempt position/status/mistakes.
- Achievements and leaderboard rank.

The frontend renders the latest typed response. It may manage selection, animations, dialogs,
theme, and other transient UI state. It must not calculate, persist, or repair learner progress
with Zustand, localStorage, optimistic arithmetic, or hardcoded demo values.

### Exercise contracts are exact

The `options`, stored `correct_answer`, and submitted `answer` shapes for all five exercise types
must match `/docs/03_API_SPEC.md` exactly:

- `multiple_choice`
- `translate_word_bank`
- `match_pairs`
- `fill_blank`
- `type_answer`

Start/retrieve/resume responses must never expose `correct_answer`, accepted answers, or hidden
solution metadata. Reveal the solution only in the answer response as specified.

Seed creation, content-admin create/edit, and runtime grading must use the same shared contract
validation. Do not maintain three slightly different validators.

### Mutations are atomic and idempotent

- Validate ownership, attempt state, exercise order, and payload before mutation.
- One valid wrong answer removes at most one heart.
- Zero hearts fails the attempt in that answer transaction.
- Completion awards XP/streak/crown/unlocks/achievements exactly once in one transaction.
- Duplicate, concurrent, early, out-of-order, completed, or failed requests return the documented
  conflict and do not create a second effect.
- Capture one clock value per transaction.

### Time is injectable

Do not call wall-clock time inside streak/heart/domain functions. Use the configured logical clock
so tests can simulate regeneration and same/next/missed activity dates. Debug clock endpoints are
disabled by default and unavailable in production.

### Database changes use migrations

- Alembic is the schema strategy; runtime `create_all()` is not.
- Enforce SQLite foreign keys on every connection.
- Preserve existing data and migration history.
- Do not rewrite or delete an applied migration to make tests pass.
- Never reset an unrecognized database or run a destructive command against an unresolved path.

### User scoping remains real

Authentication is simplified to one seeded current learner, but users, attempts, progress,
achievements, content-admin authorization, and settings stay user-scoped. Resolve the current user
through one dependency/service boundary rather than scattering a magic user ID.

---

## Functional honesty

Every visible required control must work through the real backend.

Examples that are forbidden:

- A hearts counter that decrements only in React.
- XP, crowns, streak, goal, achievements, or rank hardcoded from the seed document.
- A start button that opens a lesson without creating/resuming an attempt.
- A Continue button that advances before a successful answer response.
- A refill/practice button with no real behavior.
- A daily-goal form that shows success without persisting.
- A content-management form that edits only local component state.
- Links to `#`, empty click handlers, or unlabeled fake settings.

Allowed deferred features must be clearly presented as unavailable/coming later rather than as
working actions. This applies only to the explicitly deferred scope in
`/docs/00_REQUIREMENTS_TRACEABILITY.md`, such as pronunciation/speech, paid subscription, broader
friends/social functionality, and extra languages.

Do not add optional scope while a MUST requirement is incomplete.

---

## Original 3D frontend rules

Create an original LingoQuest identity. Do not fetch, trace, bundle, or reproduce real Duolingo
logos, mascot art, audio, screenshots, exact copy, or other protected brand assets.

The approved frontend should use reusable primitives such as:

- `Button3D`
- `IconButton3D`
- `Card3D`
- `SkillNode3D`
- `ProgressBar`
- `ProgressRing`
- `FeedbackSheet`
- `Modal3D`
- `StatPill`

Implement depth, borders, pressed travel, radii, semantic colors, typography, spacing, and motion
through shared tokens/primitives. Screens must not duplicate one-off shadow/press CSS.

The UI must remain accessible:

- Native semantics and keyboard support.
- Visible focus states not hidden by 3D shadows.
- State and correctness never communicated by color alone.
- Proper labels and error messages.
- Intentional dialog focus management.
- Reduced-motion support.
- Usable mobile touch targets and no required horizontal scrolling.

Opus visual phases review the running app using screenshots at 360px, 768px, and 1280px or wider.
Do not approve visual quality from source code alone.

---

## Testing and verification

No phase is complete merely because code was generated.

For each phase:

1. Run the exit checks in `/docs/06_IMPLEMENTATION_PHASES.md`.
2. Run the relevant cases in `/docs/08_TESTING_ACCEPTANCE.md`.
3. Fix failures introduced by the phase.
4. Record exact commands, concise results, manual flows, and remaining issues in the handoff.
5. Update the implementation-status rows and exact next request.
6. Stop after the requested phase.

Required visual phases also inspect console/network failures, keyboard behavior, reduced motion,
loading/error states, responsive layouts, and both themes if dark mode is implemented.

Never claim a test, build, screenshot review, browser flow, deployment, or URL was verified unless
it was actually run or opened in the current repository/environment.

---

## Repository safety

- Inspect `git status` before editing.
- Preserve unrelated modified/untracked user files.
- Prefer small, focused changes within the current phase.
- Do not use destructive reset, checkout, clean, or broad delete commands.
- Do not commit secrets, `.env`, local SQLite databases, caches, dependency folders, or build
  output.
- Do not change architecture, dependencies, API contracts, or schema outside the current phase
  without reporting the need first.
- Do not create commits, push, open pull requests, deploy, or send external messages unless the
  user explicitly asks.

---

## Deployment status

Deployment is currently **deferred**. Do not create hosting accounts, provider configuration,
public deployments, domains, secrets, or external resources unless the user explicitly requests
deployment work.

This deferral does not count R-15 as complete. When deployment becomes required, create/approve
the deployment specification, follow the deployment phase, and verify persistent SQLite storage
rather than claiming success on an ephemeral filesystem.

---

## End-of-task response

At the end of a phase, report only:

1. Outcome.
2. Important files changed.
3. Verification commands/manual flows and results.
4. Remaining blockers or risks.
5. Exact next phase with recommended model and skill, if any.

Also update `/docs/07_HANDOFF_CURRENT_STATE.md`. The chat response is not the durable handoff.

If blocked, describe the exact blocker and the safest next action. Do not replace the blocked
requirement with a mock implementation.