# LingoQuest — Requirements Traceability and Acceptance Criteria

## Purpose

This document converts the assignment into testable delivery requirements. It is the scope
authority for the project: implementation documents may explain *how* a requirement is built,
but they must not remove or weaken a requirement listed here.

The public product name is **LingoPath**. “Duolingo clone” describes the assignment category
only; it is not the product name and does not permit copying Duolingo assets or exact copy.

## Priority rules

When project documents or existing code disagree, use this order:

1. The original assignment document.
2. This requirements and acceptance-criteria document.
3. `/docs/03_API_SPEC.md`, `/docs/02_DATABASE_SCHEMA.md`, and
   `/docs/04_GAMIFICATION_LOGIC.md` for their respective contracts.
4. `/docs/01_ARCHITECTURE.md` for implementation structure.
5. `/docs/07_HANDOFF_CURRENT_STATE.md` for current progress only.
6. Existing implementation.

Never silently resolve a conflict. Report it, propose the smallest compliant correction, and
update all affected documents before implementing the change.

## Scope labels

- **MUST:** Required for assignment completion. It must work end to end.
- **COMMITTED BONUS:** Optional in the assignment, but intentionally included in LingoPath.
- **PLACEHOLDER ALLOWED:** May be visibly represented without full implementation, provided it
  is clearly labelled and cannot mislead the evaluator into expecting a working action.
- **OUT OF SCOPE:** Do not spend implementation time on it before every MUST requirement passes.

---

## MUST requirements

### R-01 — Learning path and skill tree

The learner can view a course divided into ordered units and skills.

Acceptance criteria:

- The path shows visually distinct `locked`, `available`, `in_progress`, and `completed` skills.
- Unlock state is derived by the backend from prerequisite progress; the frontend does not
  calculate lock state.
- Each skill shows crown/progress information using `crowns` and `max_level`.
- Locked skills cannot start a lesson.
- Available and in-progress skills open a real skill-start flow.
- The persistent top bar shows hearts, streak, total XP, gems, and daily-goal progress using
  values returned by the backend.

### R-02 — Reliable lesson start, refresh, and resume flow

Starting a skill creates or resumes a persisted lesson attempt.

Acceptance criteria:

- The skill screen uses the skill ID to call the start endpoint.
- Starting creates at most one active attempt for the same learner and skill.
- The lesson route is `/lesson/[attemptId]`; it does not confuse a skill ID, lesson ID, and
  attempt ID.
- Refreshing the lesson page retrieves the persisted attempt and continues from its saved
  `current_index`.
- Exercise payloads sent before submission never include `correct_answer`.
- Completed and failed attempts cannot be resumed as active attempts.
- A learner with zero hearts cannot start a normal lesson.

### R-03 — Five genuinely playable exercise types

The lesson player supports all required exercise types:

1. `multiple_choice`
2. `translate_word_bank`
3. `match_pairs`
4. `fill_blank`
5. `type_answer`

Acceptance criteria:

- Each type has its own usable interaction, not a shared text-field fallback.
- `options`, `correct_answer`, and submitted `answer` match the contracts in
  `/docs/03_API_SPEC.md` exactly.
- The backend validates the answer shape before grading it.
- The backend confirms that the submitted exercise belongs to the attempt and is the expected
  current exercise.
- Repeated or out-of-order answers are rejected and cannot deduct hearts twice.
- Text comparison rules are defined server-side and covered by tests.

### R-04 — Complete lesson loop and immediate feedback

The learner can finish a lesson without encountering a dead end.

Acceptance criteria:

- A visible progress bar advances from the persisted attempt index.
- Submitting an answer produces immediate correct/incorrect feedback.
- Incorrect feedback displays the correct solution returned by the backend.
- Continue advances to the next exercise only after feedback has been shown.
- The completion endpoint refuses early or duplicate completion.
- Completing the final exercise opens a real results screen showing XP, streak, crowns, and
  newly unlocked achievements from the completion response.
- Retrying after failure creates a new attempt rather than reopening the failed attempt.

### R-05 — Hearts, failure, regeneration, and refill

Hearts are persisted per learner and controlled by the backend.

Acceptance criteria:

- A wrong answer removes exactly one heart, never dropping below zero.
- Reaching zero hearts marks the attempt `failed` immediately and awards no XP.
- Heart regeneration works without a background worker and is persisted correctly when lazily
  calculated.
- Regeneration is capped at `max_hearts` and preserves partial remaining timer duration.
- The refill action works end to end and returns the updated hearts/gems values.
- The failure screen contains no clickable practice button unless a real practice flow has been
  implemented. A working refill action and a return-to-path action are sufficient.

### R-06 — XP totals and daily goal

XP is awarded only by successful lesson completion.

Acceptance criteria:

- Base XP comes from the lesson configuration.
- A perfect lesson receives the documented bonus.
- Completing an attempt can award XP only once.
- `users.total_xp` and every displayed total remain consistent after completion and refresh.
- Today’s XP is calculated from completed attempts for the learner on the current logical date.
- Daily-goal progress is `min(today_xp / daily_goal_xp, 1)` and is returned by the backend.
- Updating `daily_goal_xp` changes the displayed goal and persists after refresh.

### R-07 — Testable streak logic

Streaks update on successful lesson completion, not on lesson start or failure.

Acceptance criteria:

- The first active day starts a streak of one.
- A second lesson on the same logical day does not increment the streak.
- Activity on the next logical day increments the streak.
- Missing one or more days resets the streak to one on the next completion.
- `longest_streak` never decreases.
- Date/time is injectable or controlled through an explicitly development-only debug clock so
  the rules can be demonstrated without waiting for real days.
- Production mode cannot expose an unsafe time-changing debug endpoint.

### R-08 — Skill progress, crowns, and unlocking

Successful completion advances the selected skill and can unlock the next skill.

Acceptance criteria:

- A completion adds one crown up to `max_level`.
- A skill becomes `in_progress` after progress begins and `completed` at `max_level`.
- A prerequisite reaching at least one crown makes the dependent skill available.
- Progress-state derivation has one authoritative backend implementation and is not duplicated
  between stored status, API routers, and frontend code.
- The path reflects the new crown and unlock state immediately after returning from results.

### R-09 — Per-user persistence

All learner progress survives browser refreshes and backend restarts.

Acceptance criteria:

- Hearts, XP, streak, crowns, attempts, answers, daily goal, and achievements are stored in
  SQLite and associated with a user ID.
- Simplified authentication resolves one seeded default learner through a single
  `get_current_user()` dependency; routers do not contain a magic user ID.
- Frontend state is a cache of backend responses, not the system of record.
- Seed execution is idempotent or provides a documented safe reset command.

### R-10 — Seeded leaderboard

The leaderboard contains multiple seeded learners and highlights the current learner.

Acceptance criteria:

- Ranking uses **total XP** consistently; it does not switch between weekly and total XP.
- Seeded users have different XP totals and deterministic ranking order.
- Ties use a documented deterministic tiebreaker.
- The current learner’s rank is returned even when outside the initially displayed top group.
- After the current learner earns XP, their score and rank update from persisted backend data.

### R-11 — Learner profile and achievements

The profile presents real persisted learner information.

Acceptance criteria:

- It shows display name, join date, total XP, current/longest streak, skills completed, and
  perfect lessons.
- It shows earned and locked achievement states.
- Achievement evaluation occurs in the same transaction as lesson completion.
- The same achievement cannot be awarded twice.
- Seeded achievements are consistent with the learner’s seeded history.

### R-12 — Structured content and minimal content management

Course content must be structured, editable, and validated rather than embedded inside frontend
components.

Acceptance criteria:

- Units, skills, lessons, and exercises are stored in the database and initially populated by
  the seed script.
- A small `/admin/content` screen can browse course content and create or edit exercises.
- Content-management APIs validate the exercise-type JSON contracts before saving.
- Invalid content cannot be saved with a success response.
- Content-management controls are clearly separated from the learner experience.
- Destructive deletion is not required; omitting delete is preferable to deleting exercises
  already referenced by attempts.

### R-13 — Honest placeholders for allowed features

Only the assignment-approved areas may remain placeholders:

- Real speech recognition and pronunciation grading.
- In-app purchases or Super/subscription.
- Friends and social features beyond the seeded leaderboard.
- Additional languages beyond the seeded Spanish course.

Acceptance criteria:

- Placeholder cards are labelled `Coming Soon` or `Demo Only`.
- Placeholder controls are visibly disabled or informational.
- No clickable control calls a `501` endpoint or appears to work and then fails.
- Required features are never hidden behind a placeholder label.

### R-14 — Original, polished language-learning experience

LingoPath should feel playful and tactile without copying protected Duolingo materials.

Acceptance criteria:

- Use the LingoPath name and original logo/mascot treatment.
- Do not download, bundle, trace, or reference Duolingo logos, mascot artwork, audio, or exact
  product copy.
- Buttons, path nodes, cards, feedback surfaces, and modals use the project’s shared 3D design
  tokens and interaction primitives.
- Pressed, hover, focus, disabled, loading, success, and error states are implemented
  consistently.
- Motion supports feedback and navigation; it does not block interaction or make the interface
  feel slow.

### R-15 — Complete submission delivery

The project must be reviewable by someone who did not build it.

Acceptance criteria:

- A public GitHub repository contains the frontend, backend, migrations, seed data, tests, and
  project documents.
- `README.md` contains exact local setup, migration, seed, run, test, and build commands.
- The README explains architecture, database relationships, API endpoints, important decisions,
  and documented deviations.
- A hosted demo link is included and opens a working seeded application.
- No secret keys, local environment files, generated databases, or dependency folders are
  committed.
- A fresh clone can be set up by following only the README.

---

## Committed bonus requirements

These are implemented only after all MUST requirements pass:

### B-01 — Responsive design

- Core flows work at approximately 360 px mobile, 768 px tablet, and 1280+ px desktop widths.
- No horizontal overflow, clipped modal, unreachable action, or unusable touch target.

### B-02 — Dark mode

- Theme selection persists locally.
- Every core screen remains readable and maintains visible focus/error/success states.

### B-03 — Enhanced achievement presentation

- Achievement unlocks use an original celebratory animation and accessible text fallback.

## Deferred/out-of-scope features

- Real speech scoring.
- Real payments or subscription entitlements.
- Real friend graph or social feed.
- Multiple complete language courses.
- Timed/legendary mode.
- Heavy WebGL or Three.js scenes.
- A production authentication system.

Do not implement these until the MUST list and committed responsive-design pass are complete.

---

## Minimum verification matrix

| Requirement | Primary specification | Required verification |
|---|---|---|
| R-01, R-08 | API, gamification | Locked/available/crown path integration test and browser check |
| R-02, R-04 | API | Start, refresh, resume, answer, complete end-to-end test |
| R-03 | API | Contract and grading tests for all five exercise types |
| R-05 | Gamification | Deduction, zero-heart failure, lazy regen, refill tests |
| R-06, R-07 | Gamification | XP idempotency, daily goal, same/next/missed-day tests |
| R-09 | Architecture, schema | Restart/refresh persistence and user-isolation tests |
| R-10 | API, seed data | Deterministic ranking and post-lesson rank update test |
| R-11 | Gamification, seed data | Achievement idempotency and profile response test |
| R-12 | API | Valid create/edit and invalid-contract rejection test |
| R-13, R-14 | UI skills | Browser QA; no false action or copied brand asset |
| R-15 | README, deployment | Fresh-clone setup check and hosted smoke test |

## Global definition of done

A phase or feature is complete only when:

1. Its acceptance criteria above are satisfied.
2. Relevant automated tests pass.
3. Relevant linting and type checking pass.
4. The affected flow is manually checked in the browser.
5. There are no new browser console or failed-network errors.
6. No hardcoded backend result, fake counter, silent fallback, unresolved TODO, or non-working
   visible button remains.
7. `/docs/07_HANDOFF_CURRENT_STATE.md` records what changed, verification performed, remaining
   work, and any decisions that affect later phases.
