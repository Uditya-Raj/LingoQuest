# LingoQuest — Testing and Acceptance Contract

## Purpose

This document defines how LingoQuest proves that a feature works. It is the exit contract for the
implementation phases and the source of truth for Phase 12 and Phase 16 acceptance.

Passing means observable behavior, persisted state, and rendered UI agree. A component existing,
an endpoint returning once, or a button looking clickable is not sufficient.

Use this document together with:

- `/docs/00_REQUIREMENTS_TRACEABILITY.md` for assignment scope.
- `/docs/02_DATABASE_SCHEMA.md` for persistence invariants.
- `/docs/03_API_SPEC.md` for HTTP and exercise contracts.
- `/docs/04_GAMIFICATION_LOGIC.md` for domain rules.
- `/docs/05_SEED_DATA.md` for deterministic demo expectations.
- `/docs/07_HANDOFF_CURRENT_STATE.md` for current evidence.

If this document conflicts with a source contract, report the conflict and correct the documents
before changing behavior.

---

## Acceptance principles

1. **Test behavior, not file presence.** A route or component name does not prove functionality.
2. **Use the real backend for critical flows.** Mocked component tests supplement but do not
   replace browser tests against FastAPI and SQLite.
3. **Assert state before and after mutations.** Verify responses and persisted effects.
4. **Prove idempotency.** Duplicate/concurrent requests must not double-spend or double-award.
5. **Verify refresh and restart behavior.** Learner state must survive navigation and process
   restart because SQLite is authoritative.
6. **Cover failure paths.** Invalid answers, out-of-order requests, zero hearts, insufficient
   gems, inactive content, and network errors are required behavior.
7. **Keep tests deterministic.** Inject the logical clock and seeded randomness; never wait 15
   real minutes or depend on the real current date.
8. **Inspect the rendered product.** Responsive, accessibility, motion, and 3D consistency require
   browser evidence.
9. **No silent skips.** A required skipped test is a failure unless an explicit external blocker
   is recorded in the handoff.
10. **No fake success.** Do not replace real API calls with hardcoded counters, timers, ranks,
    crowns, completion data, or local-only learner progress.

---

## Test layers and ownership

| Layer | Required scope | Primary tooling |
|---|---|---|
| Static checks | Python/TypeScript correctness, lint, formatting as configured | Python checker/linter and TypeScript strict mode |
| Backend unit | Pure grading, hearts, XP, streak, crowns, unlocks, achievements | `pytest` |
| Backend integration | FastAPI + SQLAlchemy + temporary SQLite, real transactions | `pytest`, async HTTP client |
| Migration/seed | Upgrade from empty DB, deterministic seed/reset, invariants | Alembic, seed verification script |
| Frontend component | Exercise interaction, forms, feedback, shared UI states | Project test runner + Testing Library |
| Browser E2E | Real Next.js + FastAPI + test SQLite | Playwright or equivalent browser runner |
| Manual QA | Visual quality, keyboard, responsive, motion, console/network | Running browser and screenshots |
| Hosted smoke | Deployed frontend/backend, CORS, persistence, refresh | Browser + health/readiness requests |

Do not introduce a second test framework when the repository already has an equivalent configured.
If the repo is new, prefer pytest for backend and a single frontend runner plus Playwright.

---

## Required runnable commands

Use the package manager indicated by the committed lockfile. The manifest must expose equivalents
of the frontend scripts below. Record the exact repository commands in the handoff and README.

### Backend

```text
pytest -q
pytest -q tests/unit
pytest -q tests/integration
alembic upgrade head
python -m app.seed.seed_data
```

### Frontend

```text
<package-manager> run lint
<package-manager> run typecheck
<package-manager> run test
<package-manager> run build
<package-manager> run test:e2e
```

If lint or typecheck is folded into another command, document that fact. Never mark an
unconfigured check as passing in the README.

### Full local gate

Provide one documented developer command or short ordered command list that runs:

1. Backend unit/integration tests.
2. Frontend lint and typecheck.
3. Frontend component tests.
4. Production backend import/readiness check.
5. Production frontend build.
6. Browser E2E against an isolated database.

---

## Test-environment rules

### Isolated database

- Never run automated mutation tests against the developer's normal SQLite database.
- Give each test worker or suite an explicit temporary database path.
- Apply the actual Alembic migrations or use a test setup proven schema-equivalent to them.
- Enable `PRAGMA foreign_keys=ON` on every connection.
- Clean up only the resolved temporary database created by the test.
- E2E setup may copy or create a deterministic seed database, but tests must not depend on state
  left by a previous test.

### Deterministic time

- Inject one logical UTC clock into services.
- Freeze both UTC instant and logical activity date per test.
- Enable debug-clock routes only in the explicit test/development environment.
- Never use `sleep()` to test heart regeneration or streak changes.
- Assert production configuration does not expose `/api/debug/*`.

### Deterministic randomness

- Attempt selection must remain random in normal use.
- Tests inject a seeded selector or assert contract properties rather than a fragile exact order.
- Every new attempt contains 10 unique exercises and all five types.
- A resumed attempt returns the original stored order.

### Request isolation

- Concurrency tests use separate HTTP requests and database sessions.
- Tests must not pass because a shared in-memory object serialized operations accidentally.
- A conflict test asserts both the non-2xx response and absence of a second mutation.

---

## Backend unit-test matrix

Use descriptive test names and table-driven cases where useful. These are minimum cases, not a
coverage ceiling.

### U-GRADE — Exercise validation and grading

| ID | Case | Expected result |
|---|---|---|
| U-GRADE-01 | Correct/incorrect multiple-choice option | Exact stored option ID determines result. |
| U-GRADE-02 | Unknown multiple-choice option | Validation error; no grading mutation. |
| U-GRADE-03 | Correct/incorrect ordered word bank | Exact ordered-ID equality. |
| U-GRADE-04 | Unknown or repeated word-bank tile | Validation error. |
| U-GRADE-05 | Correct match pairs in different array order | Correct after normalized set comparison. |
| U-GRADE-06 | Unknown, repeated, or incomplete match pairs | Validation error. |
| U-GRADE-07 | Fill-blank case and whitespace variants | Correct after specified normalization. |
| U-GRADE-08 | Empty fill-blank text | Validation error. |
| U-GRADE-09 | Type-answer accepted variant | Any normalized accepted string is correct. |
| U-GRADE-10 | Unlisted type-answer text | Valid but incorrect. |
| U-GRADE-11 | Unicode-aware text normalization | Matches the API/gamification contract. |
| U-GRADE-12 | Missing, extra, or wrong-shape fields per type | Rejected by strict schemas. |

### U-HEART — Hearts

| ID | Case | Expected result |
|---|---|---|
| U-HEART-01 | Wrong answer at 5/5 | Hearts 4; anchor becomes captured `now`. |
| U-HEART-02 | Further loss while anchor exists | One heart lost; original anchor retained. |
| U-HEART-03 | Less than 15 minutes elapsed | No regeneration; countdown remains correct. |
| U-HEART-04 | Multiple full intervals elapsed | Multiple hearts restored, capped at max. |
| U-HEART-05 | Partial interval after regeneration | Anchor advances by consumed intervals; remainder preserved. |
| U-HEART-06 | Regeneration reaches full | Hearts max; anchor/countdown cleared. |
| U-HEART-07 | Correct, invalid, duplicate, or out-of-order answer | No heart deducted. |
| U-HEART-08 | Confirmed refill with 20+ gems | Exactly 20 gems spent; hearts max; anchor cleared. |
| U-HEART-09 | Full-heart refill | Conflict; no gems spent. |
| U-HEART-10 | Insufficient-gem refill | Conflict; no hearts/gems changed. |

### U-STREAK — Streak

| ID | Case | Expected result |
|---|---|---|
| U-STREAK-01 | First successful lesson | Current/longest streak become 1. |
| U-STREAK-02 | Second completion on same logical date | Current streak unchanged. |
| U-STREAK-03 | Completion on next logical date | Current streak increments. |
| U-STREAK-04 | Completion after one or more missed dates | Current streak resets to 1. |
| U-STREAK-05 | Current streak below previous record | Longest streak remains unchanged. |
| U-STREAK-06 | Failed attempt | Streak/activity date unchanged. |
| U-STREAK-07 | Stored activity date is in the future | Clock conflict; no mutation. |

### U-XP — XP and daily goal

| ID | Case | Expected result |
|---|---|---|
| U-XP-01 | Non-perfect base-10 completion | 10 XP. |
| U-XP-02 | Perfect base-10 completion | 15 XP. |
| U-XP-03 | Perfect odd base reward | 50% bonus rounds down. |
| U-XP-04 | Start, answer, failure, refill, or view | Zero XP awarded. |
| U-XP-05 | Duplicate/early completion | Zero new XP; conflict. |
| U-XP-06 | Today XP calculation | Includes only completed attempts with matching activity date. |
| U-XP-07 | Goal reached/exceeded | Progress capped at `1.0`. |
| U-XP-08 | Daily-goal edit | Progress recomputes; earned XP does not change. |

### U-PROGRESS — Crowns, states, and unlocks

| ID | Case | Expected result |
|---|---|---|
| U-PROGRESS-01 | Successful lesson below crown cap | Crown and practice count increment once. |
| U-PROGRESS-02 | Replay at max crowns | Crown remains capped; practice count increments. |
| U-PROGRESS-03 | Failed attempt | No crown/practice/unlock award. |
| U-PROGRESS-04 | Existing attempts but zero crown | Public state is `in_progress` when otherwise available. |
| U-PROGRESS-05 | Prerequisite reaches crown 1 | Dependent skill becomes available. |
| U-PROGRESS-06 | Still-unmet prerequisite | Skill remains locked. |
| U-PROGRESS-07 | Completion reaches max crown | Public state is completed. |
| U-PROGRESS-08 | Newly unlocked result | Includes true transitions only, without duplicates. |

### U-ACH — Achievements

Test every supported criteria type: streak days, total XP, completed skills, and perfect lessons.
For each, assert below-threshold, at-threshold, inactive definition, earned timestamp, and repeated
evaluation. The same user/achievement pair must never be inserted twice.

### U-TIMED — Timed practice

| ID | Case | Expected result |
|---|---|---|
| U-TIMED-01 | Start timed for locked skill | Conflict; no attempt created. |
| U-TIMED-02 | Start timed with zero hearts | Succeeds; hearts not checked. |
| U-TIMED-03 | Wrong answer in timed mode | Mistake increments; hearts unchanged. |
| U-TIMED-04 | Expiry during answer | Fails with `time_expired`; no XP. |
| U-TIMED-05 | Expiry during complete | Conflicts; no XP/streak/crown. |
| U-TIMED-06 | Successful timed completion | Awards fixed 20 XP; updates streak/practice; no crown. |
| U-TIMED-07 | Timed completion with mistakes | Awards 20 XP (not reduced). |
| U-TIMED-08 | Duplicate timed completion | Conflict; no second XP. |

---

## Backend integration-test matrix

All API tests assert status, response shape, important values, database state, and unaffected
state on failure. Check the standard error envelope from `/docs/03_API_SPEC.md`.

### I-COURSE — Course and skill state

- Seeded Maya sees Greetings and Basics completed, Food in progress, Family available, and
  Questions locked.
- Course and skill detail report identical crowns/status for the same skill.
- Shared learner totals match hearts/profile/goal services after lazy regeneration.
- Unknown skill returns the documented 404 error.
- Starting a locked or max-completed skill follows the API contract without client-side override.

### I-ATTEMPT — Start, resume, retrieve, and answer

- First start creates one attempt and returns HTTP 201.
- Repeated start for the same in-progress lesson returns the same attempt with HTTP 200.
- Start/retrieve never leaks `correct_answer`, accepted answers, or solution metadata.
- Retrieve from `/lesson/{attemptId}` alone restores exercise order, position, hearts, and status.
- Attempt contains exactly 10 unique exercise IDs and all five types.
- Correct answer advances once and loses no heart.
- Incorrect answer advances once, increments mistakes once, and loses one heart.
- Submitted exercise must match the stored current position/order.
- Wrong exercise ID, out-of-order answer, duplicate answer, malformed payload, and foreign attempt
  leave index/hearts/mistakes unchanged.
- Completed and failed attempts reject further answers with the documented conflict.

### I-FAIL — Zero-heart and time-expired failure

**Standard-mode heart failure:**

1. Arrange one heart and an in-progress standard-mode attempt.
2. Submit a valid incorrect current answer.
3. Assert the same response reports zero hearts, `failed` status, and `failure_reason=out_of_hearts`.
4. Assert `completed_at` is stamped, `activity_date`/`xp_earned` remain null, and answers remain
   auditable.
5. Assert complete/resume/answer conflict and no XP, streak, crown, unlock, or achievement changed.

**Timed-mode expiry:**

1. Create a timed attempt with injected clock.
2. Advance clock beyond expires_at.
3. Submit answer or attempt complete.
4. Assert failure with `time_expired`, no XP/streak/crown.
5. Assert wrong answers before expiry do not consume hearts.

### I-COMPLETE — Atomic completion and idempotency

- Early completion conflicts without mutation.
- Completion after all 10 answers returns XP, perfect state, crowns, streak, unlocked skills,
  achievements, and learner totals from persisted data.
- Exactly one transaction updates attempt, user XP/streak, progress, and achievements.
- Injected failure during a later completion step rolls the entire transaction back.
- Two concurrent completion requests produce one success and one conflict; all effects occur once.
- A later retry of completion does not add XP/crowns/achievements.

### I-HEARTS — Regeneration and refill API

- Status lazily applies zero, one, and multiple intervals using the logical clock.
- `next_heart_at` and `seconds_until_next` match the preserved anchor remainder.
- Confirmed refill spends exactly 20 gems.
- Missing confirmation, full hearts, and insufficient gems return documented errors without spend.
- Refreshed course/profile/heart responses agree after regeneration/refill.

### I-PROFILE — Profile, settings, leaderboard, and achievements

- Seeded Maya totals and achievement state match `/docs/05_SEED_DATA.md`.
- Valid display name/daily goal patch persists; invalid ranges/fields are rejected.
- Changing daily goal does not alter XP history.
- Leaderboard ordering is deterministic with tie-breaking from the API spec.
- Current user is identified and rank is returned even when outside a visible top subset.
- After completion, path, profile, leaderboard, achievements, and daily goal show consistent
  persisted values.

### I-CONTENT — Content management

- Non-admin access is forbidden.
- Admin tree includes structured course/unit/skill/lesson/exercise content.
- Each of the five valid exercise contracts can be created and retrieved without shape drift.
- Invalid IDs, repeated pair/tile IDs, missing blank marker, empty accepted list, and incorrect
  answer references are rejected.
- Valid edits affect future attempts.
- Editing/deactivating content snapshotted into an active attempt returns the documented conflict.
- Deactivation does not corrupt historical answers or completed attempts.

### I-DEBUG — Logical clock

- Routes are absent/404 when debug mode is disabled.
- Explicit test mode can read, advance, and reset the clock.
- Advancing time proves heart regeneration, next-day streak, skipped-day reset, and daily-XP date
  behavior without changing real system time.

### I-OWNERSHIP — User isolation

Even with simplified default-user auth, service/query boundaries must be user-scoped. Tests using
two seeded/test users assert one user cannot retrieve, answer, complete, or mutate another user's
attempt/progress/settings.

---

## Migration and seed acceptance

### Fresh database

1. Create an empty temporary SQLite file.
2. Run `alembic upgrade head`.
3. Confirm current revision equals head.
4. Run the seed command.
5. Run the seed verification report.
6. Run `PRAGMA foreign_key_check`; expect no rows.

### Required clean-seed counts

| Table | Expected |
|---|---:|
| `courses` | 1 |
| `units` | 3 |
| `skills` | 5 |
| `lessons` | 5 |
| `exercises` | 60 |
| `users` | 5 |
| `user_skill_progress` | 25 |
| `achievements` | 6 |
| `lesson_attempts` | 142 completed, 0 active/failed |
| `exercise_answers` | 1,420 |

The supported-threshold calculation determines `user_achievements`; the verification report must
print it rather than conceal an arbitrary count.

### Seed invariants

- Every skill has exactly 12 active exercises with the distribution in the seed spec.
- Every exercise passes the same validation used by admin create/edit and grading.
- Every cached `users.total_xp` equals the completed-attempt XP sum.
- Maya has total XP 340, current streak 6, longest streak 11, hearts 4/5, gems 100, today XP 10,
  daily goal 20, and goal progress 0.5 at the seed reference time.
- Maya's path is: Greetings 5/5 completed; Basics 5/5 completed; Food 2/5 in progress; Family
  0/5 available; Questions 0/5 locked.
- Leaderboard order and each total match the seed recipe.
- No seeded attempt is in progress or failed.

### Idempotency and reset

- Running normal seed twice does not increase counts or duplicate history.
- Normal seed does not silently overwrite new learner progress.
- Explicit development reset returns the isolated/local database to clean expected counts.
- Reset refuses or requires unmistakable opt-in outside a safe development/test environment.

---

## Frontend component acceptance

Component tests may mock typed API responses, but fixtures must match `/docs/03_API_SPEC.md`.

### Shared controls

- `Button3D` supports default, hover, focus-visible, pressed, disabled, loading, and reduced-motion
  states without layout shift.
- Disabled/loading buttons do not submit twice.
- Dialogs have a name, trap focus, close only through intended actions, and restore trigger focus.
- Progress bars/rings expose an accessible value and are not color-only.
- Error components distinguish retryable network failure from domain conflicts.

### Five exercise components

| Exercise | Required interaction assertions |
|---|---|
| Multiple choice | Keyboard/click selection, one active option, submit disabled before selection, payload uses `option_id`. |
| Word bank | Add/remove tiles, preserve ordered IDs, prevent duplicate use, clear/reset behavior, keyboard operation. |
| Match pairs | Left/right selection, completed-pair state, no duplicate pairing, all pairs required, payload order-independent. |
| Fill blank | Visible blank context, labeled input, trim-safe submission, Enter behavior, payload uses `text`. |
| Type answer | Labeled text area/input, accepted text entry, Enter/submit behavior, payload uses `text`. |

Each component must reset fully when its exercise ID changes. It must never receive or display a
hidden answer before submission.

### Lesson shell and feedback

- Progress reflects backend attempt position and cannot exceed total.
- Hearts render the last backend response rather than a frontend decrement formula.
- Submit is locked while the request is pending.
- Correct/incorrect feedback uses the answer response and exposes text/icon, not color alone.
- Continue advances only after a successful answer response.
- Failed status opens the zero-heart modal immediately.
- Refill success updates hearts/gems from the response and retry starts a new attempt.
- Completion result renders returned XP/streak/crowns/unlocks/achievements without recomputation.
- Refreshing a lesson URL retrieves/resumes the same attempt.

---

## Required browser end-to-end workflows

Run these against a dedicated seeded test database and the real frontend/backend. Use resilient
roles/labels or explicit test IDs; do not locate elements by fragile generated classes.

### E2E-01 — Path to successful completion

1. Load the learning path and verify all four seeded skill states.
2. Confirm top-bar values match API/profile seed values.
3. Open Family or another available/in-progress skill and start.
4. Verify the URL contains the real attempt ID.
5. Answer all five exercise types in the attempt.
6. Observe correct and incorrect feedback at least once where practical.
7. Complete the lesson and verify result values.
8. Return to path/profile/leaderboard and verify XP/crown/streak/goal/rank consistency.
9. Reload the browser and verify the state persists.

### E2E-02 — Refresh and resume

1. Start an attempt and answer at least two exercises.
2. Reload the attempt URL directly.
3. Verify the same attempt, remaining order, current position, mistakes, and hearts.
4. Finish the attempt successfully.

### E2E-03 — Hearts, failure, refill, and retry

1. Arrange low hearts through a test fixture/debug-safe setup.
2. Submit valid wrong answers until hearts reach zero.
3. Verify zero-heart failure appears in the answer response/UI.
4. Verify the old attempt cannot continue or complete.
5. Refill with gems and verify exactly 20 gems are removed.
6. Start a new attempt and verify full hearts.
7. Reload and verify hearts/gems/failure persist.

### E2E-04 — Daily goal setting

1. Open settings and change the daily goal within allowed bounds.
2. Verify success state and profile/top-bar progress update.
3. Reload and verify the setting persists.
4. Complete a lesson and verify progress is calculated from persisted today XP.

### E2E-05 — Content management

1. Open the content manager as Maya/admin.
2. Create one valid exercise through the actual form.
3. Edit it and verify the saved representation.
4. Attempt an invalid contract and verify field-level feedback with no save.
5. Confirm the changed active content is eligible for a future attempt/visible in admin tree.

### E2E-06 — Network and domain errors

- Stop or intercept the backend once and verify a clear retry state, not a blank page.
- Trigger a 404/409 validation/domain path and verify the standard message is presented.
- Restore connectivity and verify retry recovers without duplicating a mutation.

### E2E-07 — Audio playback

1. Load an exercise with tts_text and tts_lang.
2. Verify Play button is visible and keyboard accessible.
3. Click Play and verify speechSynthesis invocation (mock or real).
4. Verify Replay works after initial playback.
5. Load an exercise with audio_url and verify it takes precedence.
6. Verify unsupported/unavailable state shows honest message.

### E2E-08 — Timed practice

1. Start timed practice on an unlocked skill.
2. Verify 120-second countdown displays and updates.
3. Submit wrong answers and verify hearts remain unchanged.
4. Complete successfully and verify fixed 20 XP result.
5. Verify practice count incremented but no crown added.
6. Advance clock past expiry during another timed attempt.
7. Verify time-expired failure modal and zero XP.
8. Refresh during timed attempt and verify timer recovers.

---

## Manual responsive, accessibility, and visual QA

Automated checks cannot approve the final design. Inspect real rendered screens and record results
in the handoff.

### Required viewport matrix

| Class | Baseline viewport | Required screens |
|---|---|---|
| Mobile | 360 × 800 | Path, skill start, all exercises, feedback, failure, result, profile, leaderboard, settings, content form |
| Tablet | 768 × 1024 | Same core flows; verify navigation/layout transition |
| Desktop | 1280 × 800 or wider | Same core flows; verify max widths, winding path, side/secondary regions |

Also test one long translation, long display name, long achievement text, and browser zoom at 200%.

### Accessibility checklist

- Logical heading hierarchy and landmarks.
- Every interactive item is a native semantic control or has correct semantics.
- Complete path, lesson, settings, and content-form flows work by keyboard.
- Visible focus indicator is never clipped or hidden by 3D shadows.
- Touch targets are comfortably usable on mobile.
- Correct/incorrect, locked/available, earned/locked, and selected states are not color-only.
- Forms have persistent labels, field errors, and error summary/focus behavior where useful.
- Dialog focus is trapped/restored; Escape behavior is intentional.
- Live feedback/results are announced without repeatedly interrupting the user.
- Reduced-motion mode removes nonessential bounce/confetti/large travel while retaining feedback.
- Text and meaningful UI meet appropriate contrast; disabled state remains understandable.
- No horizontal page scroll at required widths or 200% zoom.

### 3D visual-system checklist

Use `frontend-design` for the final Opus screenshot review. Use `ui-ux-pro-max` for the dedicated
responsive/accessibility audit. These are the only two frontend skills assumed by this project.

- Shared depth, border, radius, spacing, and pressed mechanics come from reusable primitives.
- Pressed controls move toward their lower edge without shifting surrounding layout.
- Skill nodes remain distinct in locked, available, in-progress, and completed states.
- Shadows/depth do not reduce focus visibility or text contrast.
- Feedback colors are supported by icons/text.
- Motion communicates state and does not delay required actions.
- Typography, spacing, and surface hierarchy remain consistent across screens.
- Empty, loading, network-error, zero-heart, and completion states look intentional.
- Light and committed dark themes contain no unthemed/illegible surface.
- Visuals are original; no real Duolingo logo, mascot art, audio, screenshots, or exact copy.

### Browser hygiene

During every manual flow:

- No unhandled console error or hydration warning.
- No unexplained failed request.
- No request loop or duplicate mutation.
- No hidden answer appears in start/retrieve payloads.
- No button is clickable without a working, honest result.
- Loading state cannot become permanently stuck after a handled failure.

---

## MUST requirement acceptance matrix

Every row must be green before optional polish or submission. Record evidence references in the
handoff rather than changing this static matrix.

| Requirement | Automated proof | Manual/hosted proof | Pass condition |
|---|---|---|---|
| R-01 Learning path | Course/path integration tests | All four path states visible/click behavior correct | Server-derived states and real navigation agree. |
| R-02 Start/refresh/resume | Attempt lifecycle integration + E2E-02 | Direct URL refresh | Same persisted attempt restores without answer leak. |
| R-03 Five exercise types | Grader unit + schema/API + component tests | Each type played | All five submit exact contracts and are genuinely playable. |
| R-04 Lesson loop/feedback | Answer/complete integration + E2E-01 | Feedback and result inspected | No dead end; backend controls progression/completion. |
| R-05 Hearts/failure/refill | Heart unit/integration + E2E-03 | Countdown/failure/refill inspected | Loss, lazy regen, zero failure, 20-gem refill persist. |
| R-06 XP/daily goal | XP/idempotency/profile tests + E2E-04 | Values compared across screens | Totals/goal derive from completed attempts and agree. |
| R-07 Streak | Frozen-clock unit/integration | Debug test-mode demonstration | Same/next/missed dates work without real waiting. |
| R-08 Crowns/unlocks | Progress/lock integration | Path changes after completion | Crown caps and dependent unlocks occur once. |
| R-09 Persistence | User isolation + restart integration | Refresh and process-restart check | Per-user state survives and does not cross users. |
| R-10 Leaderboard | Seed/ranking/update tests | Current user/rank inspected | Deterministic total-XP ranking reflects completions. |
| R-11 Profile/achievements | Profile + achievement idempotency tests | Earned/locked states inspected | Stats and thresholds use persisted history. |
| R-12 Content management | Admin create/edit/validation tests + E2E-05 | Valid/invalid form flows | Structured content is editable without breaking contracts. |
| R-13 Audio | Component tests + E2E-07 | Play/Replay/unavailable inspected | Browser TTS or audio_url works accessibly. |
| R-14 Timed practice | Unit/integration timed tests + E2E-08 | Timer/expiry/fixed XP inspected | 120s enforced; 20 XP fixed; no hearts consumed. |
| R-15 Honest placeholders | Link/button inventory | Click every visible action | Deferred items are labeled non-actions; no fake feature. |
| R-16 Original polished UI | Frontend checks | Opus screenshot matrix and accessibility QA | Cohesive original 3D product with no copied brand asset. |
| R-17 Delivery | Clean setup/build/test checks | Public repo + hosted smoke | README works; hosted app and persistent data work. |

---

## Committed bonus acceptance

Bonuses never compensate for a red MUST requirement.

### B-01 — Responsive design

Pass only when every core flow is usable at 360, 768, and 1280+ widths with no horizontal page
overflow, clipped action, inaccessible dialog, or unreadable long content.

### B-02 — Dark mode

Pass only when the toggle works, persists as UI preference, uses semantic tokens, covers every
core/loading/error/feedback state, respects system initialization as designed, and stores no
learner progress locally.

### B-03 — Enhanced achievement presentation

Pass only when earned/locked/progress states are backed by the achievements API and remain
accessible. Decorative animation cannot invent an award or block the completion flow.

---

## Anti-placeholder and integrity audit

Before Phase 12 and Phase 16, search code and inspect behavior for:

- `TODO`, `FIXME`, `mock`, `fake`, `placeholder`, `hardcoded`, and temporary debug branches.
- Buttons with no handler, links to `#`, no-op form submissions, and permanently disabled controls.
- Frontend XP/hearts/streak/crown arithmetic or localStorage learner progress.
- Correct answers embedded in public exercise/start/retrieve payloads.
- Broad exception handlers that return 200 or conceal transaction failures.
- Runtime `create_all()` replacing Alembic migration setup.
- Seed-only leaderboard/profile values disconnected from completed attempts.
- Debug-clock routes enabled in production.
- Tracked `.env`, secrets, local databases, build output, caches, or dependency directories.
- Real Duolingo assets, copied text, or misleading Duolingo branding.

Search results are leads, not automatic failures. Inspect each match and record any intentional
fixture/example use.

---

## Hosted acceptance smoke test

Run after deployment using a clean browser session:

1. Frontend loads through HTTPS with no console/CORS error.
2. Backend health and readiness succeed; readiness confirms database connectivity/migrations.
3. Seeded path/profile/leaderboard render.
4. Start, answer, refresh, resume, complete, and return to path.
5. Reload and open a second browser session; completed state persists.
6. Change daily goal and confirm persistence.
7. Confirm public production cannot access debug-clock routes.
8. Confirm no secret, local filesystem path, or hidden answer is exposed.

If the deployment platform cannot persist SQLite, the deployment does not meet the assignment
contract. Use `/docs/09_DEPLOYMENT.md`; do not call ephemeral storage complete.

---

## Failure severity and release policy

| Severity | Examples | Release effect |
|---|---|---|
| Blocker | Data loss, migration failure, completion double-award, leaked answers, hosted app unavailable | Stop immediately. |
| High | Broken required flow, fake button/counter, zero-heart bypass, persistence failure | MUST fix before Phase 13/15. |
| Medium | One viewport unusable, keyboard trap, inconsistent API error state | Fix before submission. |
| Low | Small visual inconsistency with no usability impact | Fix during final visual QA if safe. |

Do not lower severity merely to mark a phase complete.

---

## Evidence format for the handoff

At each gate, add a compact table to `/docs/07_HANDOFF_CURRENT_STATE.md`:

| Check ID/scope | Command or flow | Result | Evidence |
|---|---|---|---|
| Example: I-COMPLETE | `pytest -q tests/integration/test_completion.py` | PASS — 8 tests | One completion mutation under concurrent requests |

For manual visual checks, include date, viewport, theme, screen/flow, and issue result. Screenshots
may be linked from a committed `/docs/screenshots/` folder when appropriate, but never commit
private data or enormous raw capture sets.

---

## Phase 12 exit gate

Phase 12 passes only when:

1. R-01 through R-14 each have current automated and/or manual evidence as specified.
2. Backend tests, frontend tests, lint, typecheck, and production builds pass.
3. E2E-01 through E2E-06 pass against the real local stack.
4. Migration and seed acceptance pass from a clean temporary database.
5. Required mobile and desktop manual flows pass with no High/Blocker issue.
6. No fake action/counter, answer leak, console error, or failed request remains.
7. The handoff names any remaining Medium/Low issue honestly.

R-15 remains provisional until deployment, README, public repository, and hosted smoke testing are
completed in Phase 15/16.

---

## Final submission gate

The project may state `SUBMISSION READY` only when:

- Phase 12 remains green after final frontend changes.
- Committed bonuses pass their acceptance sections.
- Fresh-clone setup succeeds using README instructions alone.
- All migrations, seed checks, tests, and builds pass from the submitted revision.
- Public repository and hosted URLs are reachable.
- Hosted persistence smoke test passes.
- Debug/test configuration is safe for production.
- Secret/artifact/placeholder/brand audits are clean.
- Every R-01 through R-15 row has current evidence in the handoff.

A deadline does not turn a failing requirement into a pass. Record the exact limitation instead
of presenting a mock or unverified claim as complete.