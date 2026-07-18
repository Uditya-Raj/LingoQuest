# LingoQuest — Gamification and Lesson Logic

## Purpose

This document defines the authoritative rules for lesson grading, hearts, XP, daily goals,
streaks, crowns, skill unlocking, achievements, and failure. Every rule belongs in backend
services and must be independently testable.

Related contracts:

- Persistence: `/docs/02_DATABASE_SCHEMA.md`
- HTTP shapes and errors: `/docs/03_API_SPEC.md`
- Acceptance criteria: `/docs/00_REQUIREMENTS_TRACEABILITY.md`

Frontend code renders backend results. It does not reproduce these calculations.

## Constants

Keep constants in validated backend configuration rather than scattering numbers through routes
and components.

```text
DEFAULT_MAX_HEARTS=5
HEART_REGEN_MINUTES=15
HEART_REFILL_GEM_COST=20
DEFAULT_DAILY_GOAL_XP=20
PERFECT_BONUS_NUMERATOR=1
PERFECT_BONUS_DENOMINATOR=2
ATTEMPT_EXERCISE_COUNT=10
```

The 15-minute heart interval is intentionally demo-friendly. Document the deviation in README.

## Service boundaries

```text
services/
├── lesson_engine.py       # start/resume, answer, fail, complete orchestration
├── answer_grading.py      # five exercise graders and answer validation
├── hearts.py              # lazy regeneration, loss, refill, countdown
├── xp.py                  # lesson XP, daily XP, daily-goal response
├── streak.py              # logical-date streak transitions
├── skill_progress.py      # crowns, derived state, newly unlocked skills
├── achievements.py        # criteria values and idempotent awards
├── course_path.py         # ordered course response using derived state
├── profile.py             # learner aggregates
└── leaderboard.py         # total-XP ranking
```

Routers call these services and map results to response schemas. Routers do not modify counters
or ORM rows directly.

---

## Logical clock

All time-dependent services receive the same clock abstraction from `app/core/clock.py`.

Required interface:

```python
class Clock(Protocol):
    def now_utc(self) -> datetime: ...
    def logical_date(self) -> date: ...
```

Rules:

- `now_utc()` returns a timezone-aware UTC timestamp.
- `logical_date()` returns the game date used by streak and daily XP.
- Production uses the real clock.
- Tests use a fixed/mutable fake clock.
- Development time travel applies only when `DEBUG_TIME_TRAVEL=true`.
- Do not call `datetime.now()`, `datetime.utcnow()`, or `date.today()` directly inside services.

If debug time is moved behind a user's stored `last_activity_date`, streak completion raises a
development-only `CLOCK_BEFORE_ACTIVITY` conflict instead of silently corrupting the streak. Use
the documented demo reset/reseed workflow after time-travel demonstrations.

---

## Exercise grading

`answer_grading.py` receives an exercise type, options, stored correct answer, and submitted
answer. It returns a typed grading result; it never mutates database rows.

```python
@dataclass(frozen=True)
class GradeResult:
    is_correct: bool
    revealed_correct_answer: dict[str, Any]
```

### Shared validation

- Reject null/non-object answer payloads.
- Reject fields not defined for the exercise type.
- Validate submitted option IDs against the public options.
- Reject empty text after normalization.
- Never accept correctness, XP, or heart values from the client.
- A malformed answer produces `INVALID_ANSWER_SHAPE` or `INVALID_OPTION_REFERENCE`; it does not
  count as a wrong learning answer and does not deduct a heart.

### Text normalization

Use one pure helper for `fill_blank` and `type_answer`:

```text
normalize(text):
  1. Unicode-normalize consistently (NFKC).
  2. Trim leading/trailing whitespace.
  3. Collapse consecutive internal whitespace to one space.
  4. Apply Unicode-aware case folding.
```

Do not use fuzzy matching or an LLM grader.

### Per-type correctness

- `multiple_choice`: exact equality of submitted and stored `option_id`.
- `translate_word_bank`: exact ordered equality of `ordered_ids`; no repeated IDs.
- `match_pairs`: validate one-to-one use, then compare normalized pair sets; array order does not
  matter.
- `fill_blank`: normalized submitted `text` equals normalized stored `text`.
- `type_answer`: normalized submitted `text` equals any normalized value in `accepted`.

The exact JSON shapes live in the “Public exercise contracts” section of
`/docs/03_API_SPEC.md`.

---

## Starting and resuming an attempt

### Standard-mode start

`lesson_engine.start_or_resume_skill()` runs inside a short transaction.

Order of operations:

1. Resolve the current user and requested skill inside the active course.
2. Apply and persist lazy heart regeneration.
3. Derive skill state; reject `locked`.
4. Reject start if hearts remain zero.
5. Search for an existing `in_progress` attempt for this user and skill.
6. If found, return the persisted attempt with `resumed = true`.
7. Otherwise choose the correct lesson pool.
8. Select 10 unique active exercises using stratified randomization so all five required types
   appear at least once.
9. Persist the attempt with `mode = standard`, `expires_at = null`, and ordered exercise IDs.
10. Return public exercises with correct answers removed.

### Timed-mode start

`lesson_engine.start_timed_practice()` creates a timed challenge.

Order of operations:

1. Resolve the current user and requested skill inside the active course.
2. Derive skill state; reject `locked`.
3. Do not check hearts; timed practice does not consume normal hearts.
4. Select 10 unique active exercises with all five required types.
5. Set `mode = timed` and `expires_at = logical_now + 120 seconds`.
6. Persist the attempt and ordered exercise IDs.
7. Return public exercises with mode, expires_at, and remaining_seconds.

Content requirements:

- The selected pool must have at least 10 active exercises.
- It must contain at least one valid exercise of every required type.
- If not, return `INSUFFICIENT_EXERCISES`; never create a partial/unplayable attempt.

Start does not award XP, change streak, add crowns, or increment practice count.

### Duplicate-start safety

The service performs the existing-attempt lookup and creation in one write-serialized SQLite
transaction. If concurrent requests still race, re-query after the database conflict and return
the surviving active attempt. Never leave two active attempts for the same user/skill.

---

## Answer transaction

`lesson_engine.submit_answer()` owns the complete answer mutation.

### Validation before grading

1. Load the attempt scoped to the current user; unknown or foreign IDs return `404`.
2. Require `status == in_progress`.
3. For timed mode, check if `logical_now > expires_at`; if expired, fail with `time_expired`.
4. Require submitted `position == attempt.current_index`.
5. Require the exercise ID at `exercise_order[position]` to equal submitted `exercise_id`.
6. Confirm no answer row already exists for this attempt/position or attempt/exercise.
7. Validate the type-specific answer shape.

Invalid/stale/duplicate requests stop before grading and before heart mutation.

### Atomic mutation

Within one transaction:

1. For standard mode, apply lazy heart regeneration so the displayed heart value is current.
2. Grade the answer.
3. Insert the immutable answer audit row with type and correct-answer snapshots.
4. Increment `attempt.current_index` by one.
5. Increment `mistakes_count` if incorrect.
6. For standard mode only:
   - deduct exactly one heart if incorrect;
   - increment `hearts_lost`;
   - if hearts reach zero, mark the attempt `failed` with `failure_reason = out_of_hearts` and
     set `completed_at`.
7. For timed mode, do not deduct hearts; mistakes are recorded but do not consume hearts.
8. Flush/commit before returning the response.

Correct and incorrect answers both advance to the next exercise. The assignment does not require
mistake requeueing within the same attempt.

### Response state

- `current_index` is the next expected position after the submitted answer.
- `can_complete` is true only when current index equals total exercises, status is still
  `in_progress`, and hearts are above zero.
- `lesson_status` becomes `failed` in the same wrong-answer response that reaches zero hearts.
- XP remains unawarded until the completion endpoint succeeds.

### Duplicate-answer protection

Application checks provide understandable errors; database uniqueness on attempt/position and
attempt/exercise is the final protection. A concurrent uniqueness failure maps to
`ANSWER_ALREADY_SUBMITTED` and must roll back heart/counter changes.

---

## Hearts

State:

- `users.hearts`
- `users.max_hearts`
- `users.heart_regen_anchor_at`

### Lazy regeneration

`heart_regen_anchor_at` marks the beginning of the current missing-heart timeline. Losing
additional hearts does not reset an existing anchor.

Pseudocode:

```python
def apply_regeneration(user, now, interval):
    if user.hearts >= user.max_hearts:
        user.hearts = user.max_hearts
        user.heart_regen_anchor_at = None
        return

    if user.heart_regen_anchor_at is None:
        user.heart_regen_anchor_at = now
        return

    elapsed = now - user.heart_regen_anchor_at
    intervals = floor(elapsed / interval)

    if intervals <= 0:
        return

    missing = user.max_hearts - user.hearts
    regenerated = min(intervals, missing)
    user.hearts += regenerated

    if user.hearts == user.max_hearts:
        user.heart_regen_anchor_at = None
    else:
        user.heart_regen_anchor_at += regenerated * interval
```

Advancing the anchor by consumed intervals, rather than resetting it to `now`, preserves partial
elapsed time toward the next heart.

Example with a 15-minute interval:

- Anchor 10:00, hearts 2/5, read at 10:38.
- Two full intervals elapsed, so hearts become 4/5.
- Anchor becomes 10:30.
- Next heart is due at 10:45, not 10:53.

### Losing a heart

Always apply regeneration first, then:

```python
if user.hearts <= 0:
    # Defensive conflict; an in-progress answer should not reach this state.
    raise OutOfHeartsError

was_full = user.hearts == user.max_hearts
user.hearts -= 1

if was_full or user.heart_regen_anchor_at is None:
    user.heart_regen_anchor_at = now
```

Rules:

- Floor at zero.
- One valid incorrect answer removes exactly one heart.
- Invalid or duplicate submissions remove none.
- Correct answers remove none.
- Hitting zero immediately fails the attempt.

### Heart countdown

After regeneration:

- If full: `next_heart_at = null`, `seconds_until_next = null`.
- Otherwise: `next_heart_at = anchor + interval`.
- `seconds_until_next = max(0, ceil(next_heart_at - now))`.

### Refill

Order:

1. Require explicit `confirm_spend = true`.
2. Apply lazy regeneration.
3. Reject when already full.
4. Require at least 20 gems.
5. Deduct 20 gems and set hearts to max in one transaction.
6. Clear the regeneration anchor.

Never spend gems when refill fails. The UI has no clickable practice-to-refill placeholder; it
offers working gem refill, natural regeneration, and return to path.

---

## Lesson failure

Attempts fail in two ways:

### Standard-mode heart failure

When a valid wrong answer reduces hearts to zero in standard mode:

```text
status = failed
failure_reason = out_of_hearts
completed_at = clock.now_utc()
activity_date = NULL
xp_earned = NULL
```

### Timed-mode expiry

When logical_now exceeds expires_at during answer/complete:

```text
status = failed
failure_reason = time_expired
completed_at = clock.now_utc()
activity_date = NULL
xp_earned = NULL
```

Rules for both failure types:

- Award no partial XP.
- Do not update streak.
- Do not add crowns or successful practice count.
- Do not evaluate achievements.
- Preserve answers and mistakes for audit/profile statistics where relevant.
- Failed attempts cannot resume or complete.
- Retry creates a new attempt.

---

## XP

XP is awarded only by `complete_attempt()`.

### Formula

**Standard mode:**

```python
base_xp = lesson.xp_reward
perfect = attempt.mistakes_count == 0
perfect_bonus = floor(base_xp * 1 / 2) if perfect else 0
xp_earned = base_xp + perfect_bonus
```

For the standard base reward of 10:

- Normal completion: 10 XP.
- Perfect completion: 15 XP.

**Timed mode:**

```python
xp_earned = 20  # Fixed reward regardless of mistakes
```

In the same transaction for both modes:

```text
attempt.xp_earned = xp_earned
user.total_xp += xp_earned
```

No XP is awarded for starting, individual answers, failure, refill, or viewing content.

### Idempotency

Completion first performs an atomic state transition from `in_progress` to `completed`. If the
conditional update affects zero rows, re-read and return the appropriate conflict. Never rely on
the frontend disabling the button.

`users.total_xp` is a cache that must remain equal to the XP awarded by completed attempts. Seed,
tests, and conformance audits verify this invariant.

---

## Daily XP and goal

Today's XP uses successful attempts whose stored `activity_date` equals the clock's logical date:

```sql
SELECT COALESCE(SUM(xp_earned), 0)
FROM lesson_attempts
WHERE user_id = :user_id
  AND status = 'completed'
  AND activity_date = :logical_today;
```

Progress:

```python
progress = min(today_xp / user.daily_goal_xp, 1.0)
reached = today_xp >= user.daily_goal_xp
```

Rules:

- `daily_goal_xp` is editable from 5 through 100.
- Changing the goal does not change historical XP.
- Progress may decrease when the learner raises their goal; this is expected.
- Failed attempts contribute zero.
- Completion response calculates today's XP after including the new completed attempt.
- Do not add a second daily-XP table or compute daily XP from `users.total_xp`.

---

## Streak

State:

- `users.current_streak`
- `users.longest_streak`
- `users.last_activity_date`

Update only after a successful lesson completion.

Pseudocode:

```python
def apply_streak(user, today):
    previous = user.last_activity_date

    if previous is not None and previous > today:
        raise ClockBeforeActivityError

    if previous is None:
        user.current_streak = 1
        extended_today = True
    elif previous == today:
        extended_today = False
    elif previous == today - timedelta(days=1):
        user.current_streak += 1
        extended_today = True
    else:
        user.current_streak = 1
        extended_today = True

    user.last_activity_date = today
    user.longest_streak = max(user.longest_streak, user.current_streak)
    return extended_today
```

Interpretation:

- First successful day starts at 1.
- Multiple lessons on one day do not farm streak days.
- Consecutive next-day activity increments.
- One or more missed dates restart at 1.
- Failure and start do nothing.
- Longest streak never decreases.

The completion response's `extended_today` indicates whether this completion created a new active
streak day, not merely whether a lesson succeeded.

---

## Crowns, practice count, and skill state

### Standard-mode completion

On every successful standard-mode completion:

```python
progress.crowns = min(progress.crowns + 1, skill.max_level)
progress.times_practiced += 1
progress.last_practiced_at = completed_at
```

Completed skills may be replayed in standard mode:

- XP and daily XP are still awarded.
- Streak may update normally.
- Practice count increments.
- Crowns remain at `max_level`.

### Timed-mode completion

On every successful timed-mode completion:

```python
# Crowns do NOT increment
progress.times_practiced += 1
progress.last_practiced_at = completed_at
```

Timed practice awards:

- Fixed 20 XP.
- Streak update.
- Today XP.
- Eligible achievements.
- Practice count increment.

Timed practice does NOT:

- Add crowns.
- Unlock dependent skills.
- Change skill public state from its pre-attempt value.

### Derived public state

Use one `derive_skill_state()` implementation:

```text
if crowns >= max_level:
    completed
else if crowns > 0 or any attempt exists for this user/skill:
    in_progress
else if no prerequisite or prerequisite crowns >= 1:
    available
else:
    locked
```

Attempt existence includes failed history, so a learner who tried but failed sees the skill as
`in_progress` rather than untouched. This changes presentation only; it does not unlock dependent
skills.

### Newly unlocked skills

For the completion response:

1. Derive the set of available/unlocked skill IDs before the crown change.
2. Apply the crown change.
3. Derive the set again.
4. Return IDs newly transitioning from locked to available/in-progress/completed.

Dependent skills unlock at prerequisite crowns >= 1, not only when the prerequisite reaches
`max_level`.

---

## Achievements

Evaluate active achievements after XP, streak, and crown updates are visible inside the same
completion transaction.

Criteria sources:

| Criteria | Current value |
|---|---|
| `streak_days` | `users.current_streak` |
| `total_xp` | `users.total_xp` after award |
| `skills_completed` | Count progress rows whose crowns reach related skill `max_level` |
| `perfect_lessons` | Count completed attempts with `mistakes_count == 0` |

Award rule:

```python
if current_value >= achievement.criteria_value:
    insert user_achievement if absent
```

Rules:

- Use the unique `(user_id, achievement_id)` constraint as the final idempotency guard.
- Ignore inactive achievement definitions for new awards.
- Use the same `completed_at` timestamp as `earned_at` for achievements unlocked by the current
  completion.
- Return only achievements inserted by this completion in `achievements_unlocked`.
- Profile/achievement endpoints return all active definitions with earned state and progress.
- Seeded awards must be supported by seeded history and criteria values.

Recommended required definitions:

- `first_steps`: `skills_completed >= 1`
- `streak_3`: `streak_days >= 3`
- `streak_7`: `streak_days >= 7`
- `xp_100`: `total_xp >= 100`
- `xp_500`: `total_xp >= 500`
- `perfectionist`: `perfect_lessons >= 5`

---

## Leaderboard

The assignment leaderboard ranks persisted users by total XP.

```sql
ORDER BY total_xp DESC, username ASC, id ASC
```

Rules:

- Use deterministic competition positions based on the ordered rows; the implementation may use
  simple sequential rank numbers because the username/ID tiebreaker fully orders ties.
- Return the current learner separately even when outside the requested top limit.
- Completion updates `users.total_xp` before the transaction commits, so the next leaderboard
  fetch reflects the new rank.
- Do not call it a weekly leaderboard.

---

## Atomic lesson completion

`lesson_engine.complete_attempt()` is the only path that awards successful-lesson effects.

### Preconditions

- Attempt exists and belongs to current user.
- `status == in_progress`.
- `current_index == len(exercise_order)`.
- Answer count equals exercise-order length.
- Every expected position has exactly one answer.
- User hearts are above zero after lazy regeneration.

### Transaction order

Use one database transaction and one captured `now`/`today` pair:

1. Atomically claim the in-progress attempt for completion.
2. Apply lazy heart regeneration for current response values.
3. Calculate base XP, perfect bonus, and total XP.
4. Set attempt `status`, `completed_at`, `activity_date`, and `xp_earned`.
5. Increment cached user total XP.
6. Apply streak using `activity_date`.
7. Capture pre-update unlocked state.
8. Update crowns/practice facts.
9. Calculate newly unlocked skills.
10. Evaluate and insert achievements.
11. Calculate today's XP/daily-goal response.
12. Flush all constraints and commit.
13. Serialize the response from committed/known transaction results.

If any step fails, roll back all steps. Never catch an integrity error, commit partial state, and
continue.

### Completion result

Return exactly the response contract in `/docs/03_API_SPEC.md`, including:

- Base, bonus, earned XP, and perfect flag.
- New crowns and derived skill status.
- Current/longest streak and whether today extended it.
- Today's XP and goal progress.
- Newly unlocked skill IDs.
- Newly earned achievements.
- Updated total XP, hearts, and gems.

---

## Content edits and active attempts

The content-admin service uses the same exercise validators as seed and grading.

Rules:

- Validate the complete merged exercise, not only patched fields.
- Reject edits to an exercise present in any `in_progress` attempt.
- Deactivation affects only future attempts.
- Do not destructively delete exercise history.
- Correct-answer snapshots on answer rows preserve the exact solution used for prior grading.

These rules prevent a content edit from changing the answer while a learner is on the lesson
page.

---

## Required unit-test matrix

### Answer grading

- Correct and incorrect case for every exercise type.
- Unknown option/tile/pair IDs.
- Duplicate word-bank IDs.
- Duplicate left/right match IDs and incomplete pairs.
- Case/space/Unicode normalization for text types.
- Empty or extra-field answer payloads.

### Hearts

- Wrong answer from full hearts establishes the anchor.
- Additional loss does not reset an existing anchor.
- No full interval produces no heart.
- Multiple intervals regenerate multiple hearts.
- Regeneration caps at max and clears anchor.
- Remainder is preserved after partial regeneration.
- Correct/invalid/duplicate answers deduct no heart.
- Refill deducts exactly 20 gems and clears anchor.
- Full-heart and insufficient-gem refills change nothing.

### Streak

- No previous date starts at 1.
- Second completion same date does not increment.
- Next date increments.
- Missed date resets to 1.
- Longest streak stays at maximum.
- Failure does not change streak.
- Future stored activity date raises a clock conflict.

### XP and daily goal

- Normal and perfect XP formulas.
- Odd base XP uses floor for 50% bonus.
- Failed/early/duplicate completion awards zero.
- Today's XP includes only matching logical activity date.
- Daily-goal progress caps at 1.0.
- Updating goal changes progress but not XP.

### Crowns and unlocks

- Crown increments once per completion and caps at max.
- Replay at max does not exceed max.
- Practice count increments for successful replay.
- Failed attempt produces in-progress presentation but no crown/unlock.
- Prerequisite crown one unlocks dependent skill.
- Newly unlocked IDs include only true transitions.

### Achievements

- Each criteria type awards at threshold.
- Below-threshold definitions do not award.
- Inactive definitions do not award.
- Same achievement cannot be awarded twice.
- Current completion counts toward perfect-lessons/skills-completed criteria.

## Required integration scenarios

1. Start a skill, refresh/retrieve the attempt, answer all exercises, and complete once.
2. Send the same answer twice concurrently; one succeeds and one conflicts, with one heart loss at
   most.
3. Send answers out of order; state remains unchanged.
4. Reach zero hearts; attempt fails in the final answer response and completion conflicts.
5. Refill using gems, retry with a new attempt, and complete.
6. Complete twice concurrently; XP/streak/crown/achievement effects occur once.
7. Complete on same, next, and skipped logical dates.
8. Unlock a dependent skill and confirm course/skill endpoints agree.
9. Cross the daily goal and achievement thresholds in one completion.
10. Edit content normally, then verify editing content in an active attempt conflicts.

## Gamification definition of done

Gamification is complete only when:

1. All rules above exist in services rather than routers or frontend code.
2. All unit and integration scenarios pass against SQLite with foreign keys enabled.
3. Completing/failing/refilling and refreshing produces consistent API, profile, path, and
   leaderboard values.
4. Duplicate or concurrent requests cannot create double effects.
5. Debug time travel is disabled by default and demonstrates streak/daily-XP behaviour when
   explicitly enabled.
6. No fake counter, placeholder refill/practice action, or frontend-only progress remains.