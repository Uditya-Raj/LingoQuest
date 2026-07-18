# LingoQuest — Database Schema

## Design goals

The schema must support every persisted requirement in
`/docs/00_REQUIREMENTS_TRACEABILITY.md` while remaining understandable in an interview.

Principles:

- SQLite with foreign-key enforcement enabled on every connection.
- SQLAlchemy 2.0 async models and Alembic migrations.
- Normalized relational tables for users, content, attempts, progress, and achievements.
- JSON only where exercise types genuinely require different structured payloads.
- UTC timestamps for events and an explicit logical `activity_date` for streak/daily-XP rules.
- Database constraints for important invariants, plus service validation for cross-table rules.
- No stored public skill status that can drift from crowns/prerequisite/attempt data.

## Naming and type conventions

- Primary keys: `INTEGER` autoincrement IDs.
- Timestamps: timezone-aware UTC `DATETIME` values serialized as ISO 8601.
- Game dates: `DATE`, produced by the injected logical clock.
- Booleans: non-null with explicit defaults.
- Enum-like values: `TEXT` with named `CHECK` constraints for SQLite portability.
- JSON: SQLAlchemy `JSON`, validated through Pydantic before persistence.
- Ordering: zero-based `order_index`/`position` values with parent-scoped uniqueness.

All foreign keys specify an explicit `ondelete` policy. Alembic uses a naming convention so
constraints have stable names across environments.

---

## `users`

One row per learner. The assignment uses one default seeded learner, but all state remains
user-scoped.

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `username` | TEXT | no | — | Unique stable login/demo identity |
| `display_name` | TEXT | no | — | Shown in profile and leaderboard |
| `email` | TEXT | yes | NULL | Unique when present |
| `created_at` | DATETIME | no | UTC now | |
| `total_xp` | INTEGER | no | 0 | Cached total; must equal awarded completed-attempt XP |
| `current_streak` | INTEGER | no | 0 | |
| `longest_streak` | INTEGER | no | 0 | Never lower than current streak |
| `last_activity_date` | DATE | yes | NULL | Logical date of latest successful lesson |
| `hearts` | INTEGER | no | 5 | Current persisted hearts |
| `max_hearts` | INTEGER | no | 5 | Positive configured cap |
| `heart_regen_anchor_at` | DATETIME | yes | NULL | Start of the current missing-heart regeneration timeline |
| `gems` | INTEGER | no | 0 | Persisted demo currency |
| `daily_goal_xp` | INTEGER | no | 20 | User-editable positive goal |
| `active_course_id` | INTEGER FK | yes | NULL | References `courses.id`, `ON DELETE SET NULL` |
| `is_content_admin` | BOOLEAN | no | false | Centralized demo authorization for `/admin/content` |

Constraints:

- `UNIQUE(username)`
- `UNIQUE(email)`; SQLite allows multiple NULL values.
- `CHECK(total_xp >= 0)`
- `CHECK(current_streak >= 0)`
- `CHECK(longest_streak >= current_streak)`
- `CHECK(max_hearts > 0)`
- `CHECK(hearts >= 0 AND hearts <= max_hearts)`
- `CHECK(gems >= 0)`
- `CHECK(daily_goal_xp > 0)`

Heart-anchor invariant:

- When `hearts == max_hearts`, `heart_regen_anchor_at` should be NULL.
- When hearts first fall below maximum, the hearts service sets the anchor.
- Additional losses do not reset an existing anchor.
- Lazy regeneration advances the anchor by whole regeneration intervals and preserves any
  remainder; reaching full hearts clears it.

The heart-anchor relationship is maintained transactionally by the service because SQLite check
constraints cannot compare the timestamp to application time.

---

## `courses`

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `language_code` | TEXT | no | — | Target language, e.g. `es` |
| `from_language_code` | TEXT | no | — | Source language, e.g. `en` |
| `title` | TEXT | no | — | e.g. `Spanish` |
| `icon` | TEXT | no | — | Original asset key or emoji |
| `created_at` | DATETIME | no | UTC now | |

Constraints:

- `UNIQUE(language_code, from_language_code)`
- Language codes are normalized to lowercase by the content service.

Deletion policy: units reference courses with `ON DELETE RESTRICT`. Required seeded content is
edited, not destructively deleted.

---

## `units`

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `course_id` | INTEGER FK | no | — | References `courses.id`, `ON DELETE RESTRICT` |
| `order_index` | INTEGER | no | — | Zero-based order within the course |
| `title` | TEXT | no | — | |
| `description` | TEXT | no | empty text | |
| `color_theme` | TEXT | no | — | Valid project token or validated hex colour |

Constraints:

- `UNIQUE(course_id, order_index)`
- `CHECK(order_index >= 0)`

Index:

- `ix_units_course_order(course_id, order_index)`; the unique constraint may provide this index,
  but name it explicitly through the migration if the query plan requires it.

---

## `skills`

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `unit_id` | INTEGER FK | no | — | References `units.id`, `ON DELETE RESTRICT` |
| `order_index` | INTEGER | no | — | Zero-based order within the unit |
| `title` | TEXT | no | — | |
| `description` | TEXT | no | empty text | Used by the skill-start screen |
| `icon` | TEXT | no | — | Original asset key |
| `unlock_requires_skill_id` | INTEGER FK | yes | NULL | Self-reference to `skills.id`, `ON DELETE RESTRICT` |
| `max_level` | INTEGER | no | 5 | Crown cap |

Constraints:

- `UNIQUE(unit_id, order_index)`
- `CHECK(order_index >= 0)`
- `CHECK(max_level > 0)`
- A skill cannot require itself; enforced by `CHECK(unlock_requires_skill_id IS NULL OR
  unlock_requires_skill_id != id)` where SQLite/model support permits, and always by service
  validation.

Cross-row rules enforced by the content service:

- The prerequisite must belong to the same course.
- The prerequisite must occur earlier in path order.
- Prerequisites must not form a cycle.
- A course's first available skill has no prerequisite.

Public `locked | available | in_progress | completed` state is **not stored here**. It is derived
by the skill-progress service.

Indexes:

- `ix_skills_unit_order(unit_id, order_index)`
- `ix_skills_prerequisite(unlock_requires_skill_id)`

---

## `lessons`

A lesson is an exercise-pool grouping under a skill. A learner playthrough is a
`lesson_attempts` row, not a lesson row.

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `skill_id` | INTEGER FK | no | — | References `skills.id`, `ON DELETE RESTRICT` |
| `order_index` | INTEGER | no | 0 | Order when a skill has multiple pools |
| `xp_reward` | INTEGER | no | 10 | Base successful-completion XP |

Constraints:

- `UNIQUE(skill_id, order_index)`
- `CHECK(order_index >= 0)`
- `CHECK(xp_reward > 0)`

Index:

- `ix_lessons_skill_order(skill_id, order_index)`

---

## `exercises`

Canonical editable exercise content. Exercise JSON contracts are defined in
`/docs/03_API_SPEC.md` and validated before insert/update.

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `lesson_id` | INTEGER FK | no | — | References `lessons.id`, `ON DELETE RESTRICT` |
| `order_index` | INTEGER | no | — | Stable fallback/display order |
| `type` | TEXT | no | — | Required exercise type enum |
| `prompt` | TEXT | no | — | Learner-facing prompt |
| `audio_url` | TEXT | yes | NULL | Optional original/licensed audio |
| `tts_text` | TEXT | yes | NULL | Text for browser Speech Synthesis when audio_url is null |
| `tts_lang` | TEXT | yes | NULL | BCP 47 language code for TTS, normally `es-ES` |
| `options` | JSON | yes | NULL | Type-specific options; null when the contract has none |
| `correct_answer` | JSON | no | — | Never sent before submission |
| `metadata` | JSON | yes | NULL | Validated hint/difficulty/locale data |
| `is_active` | BOOLEAN | no | true | Inactive exercises are excluded from new attempts |
| `created_at` | DATETIME | no | UTC now | |
| `updated_at` | DATETIME | no | UTC now | Updated by service on edit |

Allowed `type` values:

- `multiple_choice`
- `translate_word_bank`
- `match_pairs`
- `fill_blank`
- `type_answer`

Constraints:

- `UNIQUE(lesson_id, order_index)`
- `CHECK(order_index >= 0)`
- Named check restricting `type` to the allowed values.
- `prompt` must be non-empty after trimming; enforced by Pydantic/service validation.

Indexes:

- `ix_exercises_lesson_active(lesson_id, is_active)`
- `ix_exercises_type(type)`

Content-edit safety:

- Updating an exercise referenced by any `in_progress` attempt is rejected with `409`.
- Deactivation affects only newly started attempts.
- Existing answer audit rows store the exercise type and correct-answer snapshot used when graded.
- Destructive delete is not exposed in the minimum content manager.

---

## `lesson_attempts`

Persisted state machine for a learner playing a lesson.

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `user_id` | INTEGER FK | no | — | References `users.id`, `ON DELETE CASCADE` |
| `lesson_id` | INTEGER FK | no | — | References `lessons.id`, `ON DELETE RESTRICT` |
| `started_at` | DATETIME | no | UTC now | Real timestamp from injected clock |
| `completed_at` | DATETIME | yes | NULL | Set for successful and failed terminal attempts |
| `activity_date` | DATE | yes | NULL | Logical completion date; set only on success |
| `status` | TEXT | no | `in_progress` | `in_progress`, `completed`, or `failed` |
| `mode` | TEXT | no | `standard` | `standard` or `timed` |
| `expires_at` | DATETIME | yes | NULL | UTC expiry for timed attempts; null for standard |
| `failure_reason` | TEXT | yes | NULL | `out_of_hearts`, `time_expired`, or null |
| `exercise_order` | JSON | no | — | Ordered unique list of exercise IDs chosen at start |
| `current_index` | INTEGER | no | 0 | Next expected position; may equal list length |
| `mistakes_count` | INTEGER | no | 0 | Number of incorrect submissions |
| `hearts_lost` | INTEGER | no | 0 | Hearts removed during this attempt |
| `xp_earned` | INTEGER | yes | NULL | Set once on successful completion; 0/NULL on failure per service contract |

Constraints:

- Named check restricting status values: `in_progress`, `completed`, `failed`.
- Named check restricting mode values: `standard`, `timed`.
- Named check restricting failure_reason values: `out_of_hearts`, `time_expired`, or NULL.
- `CHECK(current_index >= 0)`
- `CHECK(mistakes_count >= 0)`
- `CHECK(hearts_lost >= 0)`
- `CHECK(xp_earned IS NULL OR xp_earned >= 0)`

Service invariants:

- `exercise_order` contains active exercises from the attempt's lesson and contains no duplicate
  IDs.
- `0 <= current_index <= len(exercise_order)`.
- `in_progress` implies `completed_at IS NULL`, `activity_date IS NULL`, and `xp_earned IS NULL`.
- `completed` implies `completed_at`, `activity_date`, and `xp_earned` are non-null.
- `failed` implies `completed_at` is non-null, `activity_date IS NULL`, and no XP was awarded.
- `mode = standard` has `expires_at IS NULL`.
- `mode = timed` has non-null `expires_at` set 120 seconds from `started_at`.
- `failure_reason = out_of_hearts` requires `mode = standard`.
- `failure_reason = time_expired` requires `mode = timed`.
- Only an `in_progress` attempt with `current_index == len(exercise_order)` can complete.
- Start/resume service returns an existing matching active attempt rather than creating a second
  active attempt for the same user and skill.

Indexes:

- `ix_attempts_user_status(user_id, status)` — active-attempt lookup.
- `ix_attempts_lesson_status(lesson_id, status)` — content-edit safety and lesson analytics.
- `ix_attempts_user_activity(user_id, activity_date, status)` — today's XP/profile aggregation.
- `ix_attempts_user_completed(user_id, completed_at)` — history.

Why `activity_date` is separate from `completed_at`:

`completed_at` is an auditable UTC timestamp. `activity_date` is the logical game date used by
the injected clock for streak simulation and daily XP. Storing it on successful completion makes
today's XP deterministic even when tests or demo time travel are used.

---

## `exercise_answers`

Immutable per-answer audit records.

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `lesson_attempt_id` | INTEGER FK | no | — | References `lesson_attempts.id`, `ON DELETE CASCADE` |
| `exercise_id` | INTEGER FK | no | — | References `exercises.id`, `ON DELETE RESTRICT` |
| `position` | INTEGER | no | — | Expected index at submission time |
| `exercise_type` | TEXT | no | — | Snapshot of the grader/contract used |
| `submitted_answer` | JSON | no | — | Validated submitted payload |
| `correct_answer_snapshot` | JSON | no | — | Solution used for grading and historical review |
| `is_correct` | BOOLEAN | no | — | |
| `answered_at` | DATETIME | no | UTC now | |

Constraints:

- `UNIQUE(lesson_attempt_id, position)`
- `UNIQUE(lesson_attempt_id, exercise_id)`
- `CHECK(position >= 0)`
- Named check restricting `exercise_type` to the five allowed values.

Indexes:

- The unique constraints back attempt-order and duplicate-answer checks.
- `ix_answers_exercise(exercise_id)` supports content usage/audit queries.

The answer service validates order before insert. A uniqueness violation is still mapped to a
`409` conflict so concurrent duplicate submissions cannot deduct hearts twice.

---

## `user_skill_progress`

Stores only progress facts that cannot be cheaply inferred from a single attempt. Public path
state remains derived.

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `user_id` | INTEGER FK | no | — | References `users.id`, `ON DELETE CASCADE` |
| `skill_id` | INTEGER FK | no | — | References `skills.id`, `ON DELETE RESTRICT` |
| `crowns` | INTEGER | no | 0 | Caps at the related skill's `max_level` in service logic |
| `times_practiced` | INTEGER | no | 0 | Successful completions for this skill |
| `last_practiced_at` | DATETIME | yes | NULL | Latest successful completion timestamp |

Constraints:

- `UNIQUE(user_id, skill_id)`
- `CHECK(crowns >= 0)`
- `CHECK(times_practiced >= 0)`

The service enforces `crowns <= skills.max_level`, which is a cross-table rule unavailable to a
normal SQLite check constraint.

There is deliberately no stored `status` column. Derive status using:

1. `completed` when `crowns >= max_level`.
2. `in_progress` when crowns are positive or the user has any attempt for the skill.
3. `available` when the prerequisite is absent or has at least one crown.
4. `locked` otherwise.

Index:

- The unique index on `(user_id, skill_id)` is the primary progress lookup.

---

## `achievements`

Achievement definitions editable through seed/content maintenance.

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `key` | TEXT | no | — | Stable unique key |
| `title` | TEXT | no | — | |
| `description` | TEXT | no | — | |
| `icon` | TEXT | no | — | Original asset key |
| `criteria_type` | TEXT | no | — | Supported criteria enum |
| `criteria_value` | INTEGER | no | — | Positive threshold |
| `is_active` | BOOLEAN | no | true | Inactive definitions are not newly awarded |

Allowed `criteria_type` values:

- `streak_days`
- `total_xp`
- `skills_completed`
- `perfect_lessons`

Constraints:

- `UNIQUE(key)`
- Named check restricting `criteria_type`.
- `CHECK(criteria_value > 0)`

---

## `user_achievements`

| Column | Type | Null | Default | Notes |
|---|---|---:|---:|---|
| `id` | INTEGER PK | no | — | |
| `user_id` | INTEGER FK | no | — | References `users.id`, `ON DELETE CASCADE` |
| `achievement_id` | INTEGER FK | no | — | References `achievements.id`, `ON DELETE RESTRICT` |
| `earned_at` | DATETIME | no | UTC now | |

Constraints:

- `UNIQUE(user_id, achievement_id)` guarantees idempotent awards.

Indexes:

- Unique `(user_id, achievement_id)` for membership checks.
- `ix_user_achievements_earned(user_id, earned_at)` for profile ordering.

---

## Relationship summary

```text
courses 1 ── N units 1 ── N skills 1 ── N lessons 1 ── N exercises
   ↑                       │
   └── users.active_course│
                           └── skills.unlock_requires_skill_id -> skills.id

users 1 ── N lesson_attempts N ── 1 lessons
lesson_attempts 1 ── N exercise_answers N ── 1 exercises
users 1 ── N user_skill_progress N ── 1 skills
users 1 ── N user_achievements N ── 1 achievements
```

## Stored versus derived values

| Value | Stored? | Authority/derivation |
|---|---:|---|
| Total XP | Yes, cached | Sum of XP awarded by completed attempts; updated atomically |
| Today's XP | No | Sum `xp_earned` for completed attempts on logical `activity_date` |
| Leaderboard rank | No | Order users by `total_xp DESC`, deterministic tiebreaker |
| Perfect lesson | No | Completed attempt with `mistakes_count == 0` |
| Skills completed | No | Progress rows whose crowns reach related `max_level` |
| Public skill status | No | Crowns + attempt existence + prerequisite progress |
| Heart countdown | No | Logical now minus `heart_regen_anchor_at` |
| Hearts | Yes | Updated by answer/refill/lazy-regen service |
| Current/longest streak | Yes | Updated on successful completion |
| Achievement earned state | Yes | Membership in `user_achievements` |

Cached `users.total_xp` is allowed for fast top-bar and leaderboard queries, but all award paths
must update it in the same transaction as `lesson_attempts.xp_earned`. Seed data must make the
cache consistent with seeded attempt history.

## Deterministic leaderboard ordering

Leaderboard order is:

```sql
ORDER BY total_xp DESC, username ASC, id ASC
```

Recommended index:

- `ix_users_leaderboard(total_xp DESC, username ASC, id ASC)`

The project uses total XP rather than weekly XP. This keeps the seeded leaderboard real and lets
the current learner's rank change immediately after completing lessons without adding a second
partially implemented XP ledger.

## Required transaction invariants

### Answer transaction

Within one transaction:

1. Load and validate the owned in-progress attempt.
2. Validate expected position/exercise and submitted JSON shape.
3. Grade using the exercise's current correct answer.
4. Insert `exercise_answers` with grading snapshots.
5. Increment `current_index`.
6. On error, increment mistakes and deduct a heart through the hearts service.
7. If hearts reach zero, mark the attempt failed and stamp `completed_at`.

Any failure rolls back the entire operation.

### Completion transaction

Within one transaction:

1. Confirm the attempt is eligible and not already terminal.
2. Calculate and set `xp_earned`, `completed_at`, `activity_date`, and `status`.
3. Increment `users.total_xp`.
4. Update streak fields using the same logical date.
5. Update crowns, successful practice count, and last-practiced timestamp.
6. Evaluate and insert new achievements.

The unique achievement constraint and attempt status check prevent duplicate effects.

### Content update transaction

Within one transaction:

1. Resolve content-admin authorization.
2. Validate exercise type and JSON contracts.
3. Reject modification when the exercise appears in an in-progress attempt.
4. Apply the update and `updated_at` timestamp.

## SQLite and migration requirements

### Foreign keys

SQLAlchemy must enable foreign keys for every SQLite connection:

```sql
PRAGMA foreign_keys = ON;
```

Verify this in an integration test; declaring FKs in models is not sufficient if the pragma is
disabled.

### Alembic

- Import every model into Alembic metadata before autogeneration.
- Review generated migrations; do not accept destructive or missing operations blindly.
- Apply migrations in tests and deployment rather than relying on `Base.metadata.create_all()`.
- If an earlier backend schema exists, generate a forward migration that preserves valid data.
- Never edit an already-applied migration to hide a later schema change.

Recommended naming convention:

```python
{
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
```

### Local database files

Ignore all of the following:

```text
*.db
*.db-shm
*.db-wal
```

The hosted backend must place the SQLite file on persistent storage as defined in
`/docs/09_DEPLOYMENT.md`.

## Seed/reset requirements

- The seed command is idempotent or exposes an explicit documented reset mode.
- Content rows use stable natural keys/order positions to avoid duplication.
- Seeded attempts and answers support the learner's XP, daily goal, profile counts, and earned
  achievements.
- Every seeded `total_xp` equals the sum of that user's seeded completed-attempt XP.
- Every seeded crown and achievement is explainable from seeded history.
- Reset is allowed only in a development/demo command, never on normal application startup.

## Schema acceptance checks

The schema is complete only when:

1. Alembic upgrades an empty database successfully.
2. Alembic can upgrade an existing earlier project database through forward migrations.
3. Foreign-key enforcement is confirmed active.
4. All named checks, unique constraints, and indexes exist.
5. Seed completes without constraint violations and reruns according to the documented policy.
6. Course/path, start/resume, answer, complete, profile, leaderboard, achievements, heart status,
   and content-manager queries work against the migrated schema.
7. Duplicate answers, duplicate achievements, invalid ordering, negative counters, invalid enum
   values, and forbidden deletes fail safely.
8. Public skill state is derived without a stored status column.
9. Today's XP uses `activity_date`, while audit timestamps remain UTC.
10. The database file is excluded from Git and configured for persistent hosted storage.