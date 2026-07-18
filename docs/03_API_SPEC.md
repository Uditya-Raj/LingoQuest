# LingoQuest — API Specification

## Conventions

Base URL:

```text
/api
```

- Request and response bodies use JSON unless an endpoint explicitly has no body.
- Field names use `snake_case` to match the Python API models.
- Timestamps are UTC ISO 8601 strings, for example `2026-07-18T10:30:00Z`.
- Logical game dates use `YYYY-MM-DD`.
- The simplified assignment authentication resolves a seeded learner through the centralized
  `get_current_user()` dependency.
- Every learner-owned query is scoped to the resolved user.
- Pydantic response models are mandatory; do not return ad-hoc ORM dictionaries.
- Unknown request fields are rejected.

The frontend TypeScript contracts in `/frontend/lib/contracts/` must mirror this document. The
backend schemas remain the runtime authority.

## Standard error response

All handled 4xx/5xx responses use:

```json
{
  "error": {
    "code": "SKILL_LOCKED",
    "message": "Complete the required skill before starting this lesson.",
    "details": {
      "required_skill_id": 2
    }
  }
}
```

`details` is optional and must not contain secrets, stack traces, or internal SQL.

Use real status codes:

- `400 Bad Request` — semantically invalid answer/content payload.
- `403 Forbidden` — current user lacks content-admin permission.
- `404 Not Found` — unknown or inaccessible resource.
- `409 Conflict` — valid request conflicts with current lesson/gamification state.
- `422 Unprocessable Entity` — outer request model failed Pydantic validation.
- `500 Internal Server Error` — unexpected failure, returned through the safe global handler.

Do not return `200` with an embedded error field.

## Shared learner summary

Screens that display the persistent top bar use this shape:

```json
{
  "id": 1,
  "display_name": "Maya",
  "hearts": 4,
  "max_hearts": 5,
  "next_heart_at": "2026-07-18T10:45:00Z",
  "total_xp": 340,
  "today_xp": 10,
  "daily_goal_xp": 20,
  "daily_goal_progress": 0.5,
  "current_streak": 6,
  "gems": 100
}
```

Rules:

- `next_heart_at` is null when hearts are full.
- `daily_goal_progress = min(today_xp / daily_goal_xp, 1.0)`.
- Heart regeneration is lazily applied and committed before this summary is serialized.

---

## Health

### `GET /api/health`

Process liveness check.

Response `200`:

```json
{
  "status": "ok",
  "service": "LingoQuest-api"
}
```

### `GET /api/ready`

Checks database connectivity and whether the required migration level is available.

Response `200`:

```json
{
  "status": "ready",
  "database": "ok"
}
```

Return `503` when the process is alive but cannot serve database-backed requests.

---

## Course and learning path

### `GET /api/course`

Returns the active course, complete ordered path, backend-derived skill states, and top-bar
learner summary.

Response `200`:

```json
{
  "learner": {
    "id": 1,
    "display_name": "Maya",
    "hearts": 4,
    "max_hearts": 5,
    "next_heart_at": "2026-07-18T10:45:00Z",
    "total_xp": 340,
    "today_xp": 10,
    "daily_goal_xp": 20,
    "daily_goal_progress": 0.5,
    "current_streak": 6,
    "gems": 100
  },
  "course": {
    "id": 1,
    "title": "Spanish",
    "language_code": "es",
    "from_language_code": "en",
    "icon": "spanish-course"
  },
  "units": [
    {
      "id": 1,
      "title": "First Steps",
      "description": "Introduce yourself and use essential words.",
      "order_index": 0,
      "color_theme": "meadow",
      "skills": [
        {
          "id": 1,
          "title": "Greetings",
          "description": "Say hello and goodbye.",
          "icon": "wave",
          "order_index": 0,
          "status": "in_progress",
          "crowns": 2,
          "max_level": 5,
          "active_attempt_id": null
        }
      ]
    }
  ]
}
```

`status` is one of:

- `locked`
- `available`
- `in_progress`
- `completed`

The course-path service derives status using crowns, attempt history, and prerequisite progress.
It does not read a stored status field.

Errors:

- `404 ACTIVE_COURSE_NOT_FOUND` — current learner has no valid active course.

### `GET /api/skills/{skill_id}`

Returns skill information for the start/resume screen.

Response `200`:

```json
{
  "skill": {
    "id": 3,
    "title": "Food",
    "description": "Learn common food and drink words.",
    "icon": "apple",
    "status": "available",
    "crowns": 0,
    "max_level": 5,
    "prerequisite": {
      "id": 2,
      "title": "Basics",
      "satisfied": true
    }
  },
  "lesson": {
    "id": 3,
    "exercise_pool_size": 11,
    "attempt_exercise_count": 10,
    "base_xp": 10
  },
  "active_attempt": null,
  "can_start": true,
  "blocked_reason": null,
  "learner": {
    "id": 1,
    "display_name": "Maya",
    "hearts": 4,
    "max_hearts": 5,
    "next_heart_at": "2026-07-18T10:45:00Z",
    "total_xp": 340,
    "today_xp": 10,
    "daily_goal_xp": 20,
    "daily_goal_progress": 0.5,
    "current_streak": 6,
    "gems": 100
  }
}
```

When an attempt exists:

```json
{
  "active_attempt": {
    "id": 42,
    "current_index": 3,
    "total_exercises": 10,
    "started_at": "2026-07-18T10:20:00Z"
  },
  "can_start": true
}
```

`can_start` is false only when the skill is locked or the learner has zero hearts. Completed
skills may be replayed; crowns remain capped at `max_level`.

Errors:

- `404 SKILL_NOT_FOUND`
- `404 SKILL_NOT_IN_ACTIVE_COURSE`

---

## Public exercise contracts

Every public exercise includes:

```json
{
  "id": 501,
  "position": 0,
  "type": "multiple_choice",
  "prompt": "Hola",
  "audio_url": null,
  "metadata": {
    "hint": "A common greeting"
  },
  "options": []
}
```

Start/resume responses never include `correct_answer`.

### `multiple_choice`

Stored/public options:

```json
[
  {"id": "a", "text": "Hello"},
  {"id": "b", "text": "Goodbye"}
]
```

Stored/revealed correct answer:

```json
{"option_id": "a"}
```

Submitted answer:

```json
{"option_id": "a"}
```

Validation/grading:

- `option_id` must reference exactly one public option.
- Correct only when it equals the stored `option_id`.

### `translate_word_bank`

Stored/public options:

```json
[
  {"id": "w1", "text": "I"},
  {"id": "w2", "text": "drink"},
  {"id": "w3", "text": "water"},
  {"id": "w4", "text": "bread"}
]
```

Stored/revealed correct answer:

```json
{"ordered_ids": ["w1", "w2", "w3"]}
```

Submitted answer:

```json
{"ordered_ids": ["w1", "w2", "w3"]}
```

Validation/grading:

- Every submitted ID must exist in options.
- No submitted ID may repeat.
- Exact ordered-ID equality determines correctness.
- Distractors may remain unused.

### `match_pairs`

Stored/public options:

```json
{
  "left": [
    {"id": "l1", "text": "agua"},
    {"id": "l2", "text": "pan"}
  ],
  "right": [
    {"id": "r1", "text": "water"},
    {"id": "r2", "text": "bread"}
  ]
}
```

Stored/revealed correct answer:

```json
{
  "pairs": [
    {"left_id": "l1", "right_id": "r1"},
    {"left_id": "l2", "right_id": "r2"}
  ]
}
```

Submitted answer uses the same shape.

Validation/grading:

- Every left/right ID must exist in its respective option set.
- A left or right ID cannot be used more than once.
- The submission must pair every left item exactly once.
- Pair-array order does not matter; compare normalized pair sets.

### `fill_blank`

Requirements:

- `prompt` contains exactly one `___` marker.
- Public `options` is null.

Stored/revealed correct answer:

```json
{"text": "es"}
```

Submitted answer:

```json
{"text": "Es"}
```

Validation/grading:

- Trim leading/trailing whitespace.
- Collapse repeated internal whitespace.
- Compare with Unicode-aware case folding.
- Empty text is invalid.

### `type_answer`

Public `options` is null.

Stored/revealed correct answer:

```json
{"accepted": ["hello", "hi"]}
```

Submitted answer:

```json
{"text": "Hi"}
```

Validation/grading:

- Normalize with trim, repeated-space collapse, and Unicode-aware case folding.
- Correct when normalized text equals any normalized accepted value.
- The accepted list must contain at least one non-empty unique value.
- Do not implement fuzzy/LLM grading for this assignment.

---

## Lesson attempts

### Shared public attempt response

Start and retrieve endpoints use:

```json
{
  "attempt_id": 42,
  "skill_id": 3,
  "lesson_id": 3,
  "skill_title": "Food",
  "status": "in_progress",
  "resumed": false,
  "started_at": "2026-07-18T10:20:00Z",
  "completed_at": null,
  "current_index": 0,
  "total_exercises": 10,
  "hearts": 4,
  "max_hearts": 5,
  "next_heart_at": "2026-07-18T10:45:00Z",
  "mistakes_count": 0,
  "exercises": [
    {
      "id": 501,
      "position": 0,
      "type": "multiple_choice",
      "prompt": "Hola",
      "audio_url": null,
      "metadata": {"hint": "A common greeting"},
      "options": [
        {"id": "a", "text": "Hello"},
        {"id": "b", "text": "Goodbye"}
      ]
    }
  ],
  "terminal_summary": null
}
```

`resumed` is meaningful in the start response. The retrieve endpoint returns it as true when the
attempt remains in progress and false for terminal attempts.

For completed attempts, `terminal_summary` may be:

```json
{
  "outcome": "completed",
  "xp_earned": 15,
  "perfect": true,
  "completed_at": "2026-07-18T10:30:00Z"
}
```

For failed attempts:

```json
{
  "outcome": "failed",
  "xp_earned": 0,
  "perfect": false,
  "completed_at": "2026-07-18T10:26:00Z"
}
```

### `POST /api/skills/{skill_id}/start`

Starts or resumes an attempt. No request body is required.

Behaviour:

1. Lazily apply heart regeneration.
2. Reject locked skills.
3. Reject normal start when hearts are zero.
4. Return an existing in-progress attempt for this user/skill when present.
5. Otherwise select the skill's lesson pool and a randomized set of 10 unique active exercises,
   stratified to include at least one of every required exercise type.
6. Persist the exercise order before responding.

Responses:

- `201 Created` with the public attempt response and `resumed: false` for a new attempt.
- `200 OK` with the public attempt response and `resumed: true` for an existing attempt.

Errors:

- `404 SKILL_NOT_FOUND`
- `409 SKILL_LOCKED`, details include the prerequisite skill.
- `409 OUT_OF_HEARTS`, details include `next_heart_at`.
- `409 INSUFFICIENT_EXERCISES` when the content pool cannot build a playable attempt.

### `GET /api/lessons/{attempt_id}`

Retrieves the current user's persisted attempt so `/lesson/[attemptId]` survives refresh and
direct navigation.

Response `200`: shared public attempt response.

Rules:

- Return the full original public exercise list in its persisted order.
- Do not expose correct answers, including for exercises already answered.
- `current_index` identifies the next expected exercise.
- A terminal attempt may be displayed as results/failure or redirected safely; it is never
  treated as active.

Errors:

- `404 ATTEMPT_NOT_FOUND` for unknown attempts or attempts owned by another user.

### `POST /api/lessons/{attempt_id}/answer`

Request:

```json
{
  "exercise_id": 501,
  "position": 0,
  "answer": {
    "option_id": "a"
  }
}
```

`answer` is validated against the persisted exercise type after the owned attempt and expected
exercise are resolved.

Response `200`:

```json
{
  "attempt_id": 42,
  "exercise_id": 501,
  "position": 0,
  "is_correct": false,
  "correct_answer": {
    "option_id": "a"
  },
  "current_index": 1,
  "total_exercises": 10,
  "mistakes_count": 1,
  "hearts_remaining": 3,
  "max_hearts": 5,
  "next_heart_at": "2026-07-18T10:45:00Z",
  "lesson_status": "in_progress",
  "can_complete": false
}
```

Rules:

- `current_index` is the next expected index after the answer is committed.
- Wrong answers advance the attempt and deduct one heart.
- When the last exercise is answered with hearts remaining, `can_complete` is true and the
  frontend calls the completion endpoint.
- When hearts reach zero, the same response contains `lesson_status: "failed"`,
  `can_complete: false`, and the terminal attempt is already persisted.
- XP is not awarded by the answer endpoint.

Errors:

- `404 ATTEMPT_NOT_FOUND`
- `409 ATTEMPT_TERMINAL` — attempt is already completed or failed.
- `409 ANSWER_OUT_OF_ORDER` — `position` or `exercise_id` is not the current expected exercise.
- `409 ANSWER_ALREADY_SUBMITTED` — uniqueness conflict from a duplicate/concurrent request.
- `400 INVALID_ANSWER_SHAPE` — type-specific answer validation failed.
- `400 INVALID_OPTION_REFERENCE` — submitted IDs are not present in public options.

### `POST /api/lessons/{attempt_id}/complete`

No request body.

The service validates that the owned attempt is in progress, hearts are above zero, and every
exercise has been answered. It then performs all gamification updates in one transaction.

Response `200`:

```json
{
  "attempt_id": 42,
  "skill": {
    "id": 3,
    "title": "Food",
    "new_crowns": 3,
    "max_level": 5,
    "status": "in_progress"
  },
  "xp": {
    "base": 10,
    "perfect_bonus": 5,
    "earned": 15,
    "perfect": true
  },
  "streak": {
    "current": 7,
    "longest": 11,
    "extended_today": true,
    "activity_date": "2026-07-19"
  },
  "daily_goal": {
    "today_xp": 25,
    "goal_xp": 20,
    "progress": 1.0,
    "reached": true
  },
  "unlocked_skill_ids": [4],
  "achievements_unlocked": [
    {
      "key": "streak_7",
      "title": "A Full Week",
      "description": "Learn for seven days in a row.",
      "icon": "calendar-star"
    }
  ],
  "user_totals": {
    "total_xp": 355,
    "hearts": 4,
    "max_hearts": 5,
    "gems": 100
  },
  "completed_at": "2026-07-19T10:30:00Z"
}
```

Errors:

- `404 ATTEMPT_NOT_FOUND`
- `409 ATTEMPT_ALREADY_COMPLETED`
- `409 ATTEMPT_FAILED`
- `409 LESSON_NOT_READY` — not all expected exercises are answered.
- `409 OUT_OF_HEARTS`

Duplicate completion must never award XP, streak, crowns, or achievements twice.

---

## Hearts

### `GET /api/hearts/status`

Applies lazy regeneration and returns:

```json
{
  "hearts": 4,
  "max_hearts": 5,
  "next_heart_at": "2026-07-18T10:45:00Z",
  "seconds_until_next": 420,
  "regen_interval_minutes": 15
}
```

When full:

```json
{
  "hearts": 5,
  "max_hearts": 5,
  "next_heart_at": null,
  "seconds_until_next": null,
  "regen_interval_minutes": 15
}
```

### `POST /api/hearts/refill`

Refills to `max_hearts` for the documented demo gem cost.

Request:

```json
{
  "confirm_spend": true
}
```

Response `200`:

```json
{
  "hearts": 5,
  "max_hearts": 5,
  "gems": 80,
  "gems_spent": 20,
  "next_heart_at": null
}
```

Rules:

- Refill cost is 20 gems.
- If already full, return `409 HEARTS_ALREADY_FULL` and spend nothing.
- If `confirm_spend` is not true, return `400 REFILL_NOT_CONFIRMED`.
- If gems are insufficient, return `409 INSUFFICIENT_GEMS` and change nothing.
- Refill and gem deduction occur in one transaction.

There is no fake practice-to-refill button. The failure UI offers this working refill action and
a return-to-path action. Normal lazy regeneration remains available when gems are insufficient.

---

## User and profile

### `GET /api/user/me`

Response `200`:

```json
{
  "user": {
    "id": 1,
    "username": "maya_demo",
    "display_name": "Maya",
    "email": "maya@example.test",
    "joined_at": "2026-06-01T08:00:00Z",
    "active_course": {
      "id": 1,
      "title": "Spanish",
      "icon": "spanish-course"
    }
  },
  "stats": {
    "total_xp": 340,
    "today_xp": 10,
    "daily_goal_xp": 20,
    "daily_goal_progress": 0.5,
    "current_streak": 6,
    "longest_streak": 11,
    "hearts": 4,
    "max_hearts": 5,
    "gems": 100,
    "skills_completed": 2,
    "lessons_completed": 24,
    "perfect_lessons": 6
  },
  "achievements": [
    {
      "id": 1,
      "key": "first_steps",
      "title": "First Steps",
      "description": "Complete your first skill.",
      "icon": "footprints",
      "earned": true,
      "earned_at": "2026-06-01T08:20:00Z"
    }
  ]
}
```

### `PATCH /api/user/me`

Request may contain either or both fields:

```json
{
  "display_name": "Maya R.",
  "daily_goal_xp": 30
}
```

Validation:

- At least one field is required.
- `display_name`: trimmed, 1–50 characters.
- `daily_goal_xp`: integer from 5 through 100.
- Unknown fields are rejected.

Response `200`:

```json
{
  "display_name": "Maya R.",
  "daily_goal_xp": 30,
  "today_xp": 10,
  "daily_goal_progress": 0.3333
}
```

Settings placeholders such as subscription, friends, pronunciation, and additional languages do
not call this endpoint and do not call fake `501` endpoints.

---

## Leaderboard

### `GET /api/leaderboard`

Optional query:

```text
?limit=10
```

`limit` defaults to 10 and is restricted to 1–50.

Response `200`:

```json
{
  "ranking_basis": "total_xp",
  "entries": [
    {
      "rank": 1,
      "user_id": 2,
      "display_name": "Leo",
      "total_xp": 520,
      "current_streak": 8,
      "is_current_user": false
    },
    {
      "rank": 3,
      "user_id": 1,
      "display_name": "Maya",
      "total_xp": 340,
      "current_streak": 6,
      "is_current_user": true
    }
  ],
  "current_user": {
    "rank": 3,
    "user_id": 1,
    "display_name": "Maya",
    "total_xp": 340,
    "current_streak": 6,
    "is_current_user": true
  }
}
```

Rules:

- Rank by `total_xp DESC`, then `username ASC`, then `id ASC`.
- `current_user` is always returned even when absent from the limited entries.
- Completing a lesson changes the current user's next leaderboard response.
- Do not label this a weekly leaderboard.

---

## Achievements

### `GET /api/achievements`

Returns all active definitions, earned state, and current progress.

Response `200`:

```json
{
  "achievements": [
    {
      "id": 2,
      "key": "streak_7",
      "title": "A Full Week",
      "description": "Learn for seven days in a row.",
      "icon": "calendar-star",
      "criteria_type": "streak_days",
      "criteria_value": 7,
      "current_value": 6,
      "earned": false,
      "earned_at": null
    }
  ]
}
```

The achievement service calculates `current_value` using the same sources used during award
evaluation.

---

## Content administration

All admin endpoints require `require_content_admin()`. They are real assignment-demo operations,
not frontend-only mocks.

### Admin exercise representation

Unlike learner endpoints, authorized admin responses include `correct_answer`:

```json
{
  "id": 501,
  "lesson_id": 3,
  "order_index": 0,
  "type": "multiple_choice",
  "prompt": "Hola",
  "audio_url": null,
  "options": [
    {"id": "a", "text": "Hello"},
    {"id": "b", "text": "Goodbye"}
  ],
  "correct_answer": {"option_id": "a"},
  "metadata": {"hint": "A common greeting"},
  "is_active": true,
  "created_at": "2026-07-01T08:00:00Z",
  "updated_at": "2026-07-01T08:00:00Z"
}
```

### `GET /api/admin/content/tree`

Returns all courses, units, skills, lessons, and admin exercise representations in deterministic
path order for the content-manager screen.

Response `200`:

```json
{
  "courses": [
    {
      "id": 1,
      "title": "Spanish",
      "units": [
        {
          "id": 1,
          "title": "First Steps",
          "skills": [
            {
              "id": 1,
              "title": "Greetings",
              "lessons": [
                {
                  "id": 1,
                  "order_index": 0,
                  "xp_reward": 10,
                  "exercises": []
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### `POST /api/admin/exercises`

Creates an exercise.

Request:

```json
{
  "lesson_id": 3,
  "order_index": 11,
  "type": "fill_blank",
  "prompt": "Ella ___ mi hermana.",
  "audio_url": null,
  "options": null,
  "correct_answer": {"text": "es"},
  "metadata": {"hint": "Use the verb ser"},
  "is_active": true
}
```

Response:

- `201 Created` with the complete admin exercise representation.

Errors:

- `403 CONTENT_ADMIN_REQUIRED`
- `404 LESSON_NOT_FOUND`
- `409 EXERCISE_ORDER_CONFLICT`
- `400 INVALID_EXERCISE_CONTRACT`

### `PATCH /api/admin/exercises/{exercise_id}`

Updates any editable exercise fields. Omitted fields retain their stored values. The service
merges the patch with the stored exercise and validates the complete resulting exercise contract.

Example request:

```json
{
  "prompt": "Mi hermana ___ estudiante.",
  "correct_answer": {"text": "es"},
  "metadata": {"hint": "Use the third-person form"}
}
```

Response `200`: complete updated admin exercise representation.

Errors:

- `403 CONTENT_ADMIN_REQUIRED`
- `404 EXERCISE_NOT_FOUND`
- `409 CONTENT_IN_ACTIVE_ATTEMPT`
- `409 EXERCISE_ORDER_CONFLICT`
- `400 INVALID_EXERCISE_CONTRACT`

Setting `is_active: false` is the supported removal workflow. The minimum content manager does
not expose destructive delete.

---

## Development-only logical clock

These routes are registered only when `DEBUG_TIME_TRAVEL=true`. They must not appear in normal
production OpenAPI output.

### `GET /api/debug/clock`

Response:

```json
{
  "real_now": "2026-07-18T10:00:00Z",
  "logical_now": "2026-07-18T10:00:00Z",
  "offset_days": 0
}
```

### `POST /api/debug/clock/advance`

Request:

```json
{"days": 1}
```

Validation: integer from 1 through 365.

Response:

```json
{
  "logical_now": "2026-07-19T10:00:00Z",
  "logical_date": "2026-07-19",
  "offset_days": 1
}
```

### `POST /api/debug/clock/reset`

Returns the logical clock to the real clock.

The streak, daily-XP, attempt activity date, and heart-regeneration services all use this same
clock dependency.

---

## Error-code catalogue

| HTTP | Code | Meaning |
|---:|---|---|
| 400 | `INVALID_ANSWER_SHAPE` | Answer does not match the exercise type |
| 400 | `INVALID_OPTION_REFERENCE` | Submitted option IDs do not exist |
| 400 | `INVALID_EXERCISE_CONTRACT` | Admin/seed content violates its type contract |
| 400 | `REFILL_NOT_CONFIRMED` | Gem spend was not explicitly confirmed |
| 403 | `CONTENT_ADMIN_REQUIRED` | Current user cannot manage content |
| 404 | `ACTIVE_COURSE_NOT_FOUND` | Learner has no valid active course |
| 404 | `SKILL_NOT_FOUND` | Skill does not exist |
| 404 | `SKILL_NOT_IN_ACTIVE_COURSE` | Skill is outside the learner's active course |
| 404 | `ATTEMPT_NOT_FOUND` | Attempt does not exist or is not owned by current user |
| 404 | `LESSON_NOT_FOUND` | Admin target lesson does not exist |
| 404 | `EXERCISE_NOT_FOUND` | Admin exercise does not exist |
| 409 | `SKILL_LOCKED` | Prerequisite has not been satisfied |
| 409 | `OUT_OF_HEARTS` | Learner cannot start/complete with zero hearts |
| 409 | `INSUFFICIENT_EXERCISES` | Lesson pool cannot build a playable attempt |
| 409 | `ATTEMPT_TERMINAL` | Answer submitted to completed/failed attempt |
| 409 | `ANSWER_OUT_OF_ORDER` | Stale/wrong current exercise submitted |
| 409 | `ANSWER_ALREADY_SUBMITTED` | Duplicate or concurrent answer |
| 409 | `LESSON_NOT_READY` | Completion requested before all answers |
| 409 | `ATTEMPT_ALREADY_COMPLETED` | Duplicate completion request |
| 409 | `ATTEMPT_FAILED` | Completion requested for failed attempt |
| 409 | `HEARTS_ALREADY_FULL` | Refill requested with full hearts |
| 409 | `INSUFFICIENT_GEMS` | Learner cannot pay refill cost |
| 409 | `CONTENT_IN_ACTIVE_ATTEMPT` | Editing would alter an active attempt |
| 409 | `EXERCISE_ORDER_CONFLICT` | Duplicate order inside a lesson |

## Security and disclosure rules

- Learner start/retrieve payloads never include `correct_answer`.
- An answer response reveals only the submitted exercise's solution after grading.
- Admin content endpoints are the only read endpoints that return unsubmitted solutions.
- Return `404`, not ownership details, when a learner requests another user's attempt.
- Never accept `user_id`, XP, hearts, crowns, correctness, or achievement fields from the learner
  client.
- Never trust the frontend's submitted `position`; use it only for stale-request detection and
  require it to equal the stored `current_index`.
- CORS origins come from the explicit environment allowlist.

## API acceptance checklist

The API contract is complete only when:

1. Generated OpenAPI contains every non-debug endpoint and the declared response models.
2. Debug endpoints appear only when explicitly enabled.
3. Course and skill endpoints return backend-derived state and shared learner totals.
4. Start returns `201` for new and `200` for resumed attempts without answers.
5. Retrieve restores an attempt from the URL alone.
6. All five exercise answer shapes validate and grade according to this document.
7. Duplicate/out-of-order answers and early/duplicate completion cannot mutate state twice.
8. Zero-heart failure is persisted and returned in the answer response.
9. Completion atomically returns XP, streak, crowns, unlocks, achievements, and updated totals.
10. Profile, daily goal, leaderboard, hearts, and achievements reflect persisted completion data.
11. Content create/edit uses the same exercise-contract validation as seed and grading.
12. Every handled failure uses the standard error shape and correct non-200 status.
13. Automated tests assert representative success and error response bodies, not status codes
    alone.