# LingoQuest — Seed Data Plan

## Purpose

The seeded application must be immediately demonstrable while remaining internally consistent.
Seed data is persisted through the real database schema; it is not a frontend mock layer.

After seeding, an evaluator can immediately inspect:

- Completed, in-progress, available, and locked path states.
- Crown/progress rings and dependent-skill unlocking.
- A non-empty profile and achievement collection.
- A total-XP leaderboard where the default learner is not first.
- A partially completed daily goal and one regenerating heart.
- Every required exercise type through real lesson attempts.
- Real editable content in `/admin/content`.

All shapes must follow `/docs/03_API_SPEC.md`, and all persisted values must satisfy
`/docs/02_DATABASE_SCHEMA.md` and `/docs/04_GAMIFICATION_LOGIC.md`.

## Seed command

Run from `/backend`:

```bash
python -m app.seed.seed_data
```

Supported development options:

```bash
python -m app.seed.seed_data --reference-date 2026-07-18
python -m app.seed.seed_data --reset --yes
python -m app.seed.seed_data --reset --yes --reference-date 2026-07-18
```

Rules:

- Default `reference_date` is the injected clock's logical date.
- `--reference-date` makes screenshots/tests reproducible.
- Default execution is idempotent: upsert definitions/content and create demo history only when
  the known seeded user has no history.
- A rerun must not duplicate content, attempts, answers, progress, or achievements.
- `--reset` deletes only known LingoQuest seeded users/content in child-first order, then rebuilds
  them.
- `--reset` is rejected when `APP_ENV=production`.
- `--reset` requires `--yes`; never reset automatically on normal application startup.
- Execute seed/reset inside explicit transactions and roll back on validation failure.

## File layout

```text
/backend/app/seed/
├── __init__.py
├── content.py          # course, units, skills, lessons, exercises, achievements
├── history.py          # deterministic demo users and historical attempt recipes
├── validators.py       # invokes the same exercise validators as admin APIs
└── seed_data.py        # CLI, upsert/reset orchestration, verification report
```

Do not place a giant inline data structure in `seed_data.py`. Keep the CLI/orchestration readable.

---

## Course

Seed one course:

| Field | Value |
|---|---|
| Target language | Spanish (`es`) |
| Source language | English (`en`) |
| Title | Spanish |
| Icon | `spanish-course` (original local icon key) |

Use original LingoQuest writing and asset keys. Do not fetch a Duolingo course flag or other brand
asset.

## Units, skills, and prerequisite chain

Seed three units and five skills:

| Unit | Theme | Skill | Icon | Prerequisite |
|---|---|---|---|---|
| 1. First Steps | `meadow` | Greetings | `wave` | none |
| 1. First Steps | `meadow` | Basics | `spark` | Greetings |
| 2. Everyday Life | `ocean` | Food | `apple` | Basics |
| 2. Everyday Life | `ocean` | Family | `home-heart` | Food |
| 3. Conversations | `violet` | Questions | `question-bubble` | Family |

Exact ordered definitions:

### Unit 1 — First Steps

Description: `Introduce yourself and use essential Spanish words.`

1. **Greetings**
   - Description: `Say hello, goodbye, and use polite expressions.`
   - Vocabulary: `hola`, `adiós`, `buenos días`, `buenas noches`, `gracias`, `por favor`,
     `mucho gusto`, `hasta luego`.
2. **Basics**
   - Description: `Build short sentences with people, articles, and the verb ser.`
   - Vocabulary: `yo`, `tú`, `él`, `ella`, `soy`, `eres`, `es`, `un`, `una`, `el`, `la`.

### Unit 2 — Everyday Life

Description: `Talk about food, drinks, and the people close to you.`

1. **Food**
   - Description: `Recognize common food and drink words.`
   - Vocabulary: `agua`, `pan`, `manzana`, `leche`, `comer`, `beber`, `quiero`.
2. **Family**
   - Description: `Describe close family members.`
   - Vocabulary: `familia`, `madre`, `padre`, `hermano`, `hermana`, `hijo`, `hija`.

### Unit 3 — Conversations

Description: `Ask and understand useful everyday questions.`

1. **Questions**
   - Description: `Ask who, what, where, when, and how.`
   - Vocabulary/phrases: `¿Cómo estás?`, `¿Qué es esto?`, `¿Dónde está...?`, `¿Quién es?`,
     `¿Cuándo?`.

Each skill has one lesson pool with:

```text
order_index = 0
xp_reward = 10
max_level = 5
```

The schema supports more lesson pools later, but one per skill is enough for the assignment.

---

## Exercise quantity and distribution

Seed exactly **12 active exercises per skill**: 60 total.

Distribution per skill:

| Type | Count |
|---|---:|
| `multiple_choice` | 3 |
| `translate_word_bank` | 2 |
| `match_pairs` | 2 |
| `fill_blank` | 2 |
| `type_answer` | 3 |
| **Total** | **12** |

The start service chooses 10 unique exercises using stratified randomization, guaranteeing at
least one of every type. Twelve available exercises allow replayed crown attempts to vary while
remaining small enough to review for language accuracy.

## Exercise authoring rules

Every exercise must:

- Use the exact JSON shape for its type.
- Use stable string IDs unique within that exercise, such as `greet_mc_01_a`.
- Have a non-empty prompt and correct answer.
- Use only option IDs present in its own options.
- Use original LingoQuest copy.
- Stay within the vocabulary/difficulty of its skill.
- Use `audio_url = null` unless real original/licensed audio is available.
- Include at least three exercises per skill with `tts_text` and `tts_lang` (normally `es-ES`) for
  browser Speech Synthesis playback.
- Across all seeded exercises, include audio support (either audio_url or TTS) for all five
  exercise types where pedagogically meaningful.
- Include short optional `metadata.hint` and a `metadata.difficulty` value of 1–3.
- Pass the same Pydantic validator used by content-admin create/edit.

Show audio button when `audio_url` is present or when both `tts_text` and `tts_lang` are present.
Use `audio_url` in preference to TTS when both are available.

### Multiple-choice example

```python
{
    "type": "multiple_choice",
    "prompt": "What does ‘hola’ mean?",
    "options": [
        {"id": "greet_mc_01_a", "text": "Hello"},
        {"id": "greet_mc_01_b", "text": "Goodbye"},
        {"id": "greet_mc_01_c", "text": "Please"},
    ],
    "correct_answer": {"option_id": "greet_mc_01_a"},
    "metadata": {"hint": "It is a greeting.", "difficulty": 1},
}
```

Quality rules:

- Use 3–4 plausible choices.
- Exactly one option is correct.
- Avoid trick questions and duplicate text.

### Translate-word-bank example

```python
{
    "type": "translate_word_bank",
    "prompt": "Build: ‘I drink water’",
    "options": [
        {"id": "food_wb_01_yo", "text": "Yo"},
        {"id": "food_wb_01_bebo", "text": "bebo"},
        {"id": "food_wb_01_agua", "text": "agua"},
        {"id": "food_wb_01_pan", "text": "pan"},
    ],
    "correct_answer": {
        "ordered_ids": ["food_wb_01_yo", "food_wb_01_bebo", "food_wb_01_agua"]
    },
    "metadata": {"hint": "Start with the subject.", "difficulty": 2},
}
```

Quality rules:

- Include 1–2 plausible distractors.
- Do not repeat an option ID.
- Correct order must form a natural phrase.

### Match-pairs example

```python
{
    "type": "match_pairs",
    "prompt": "Match each Spanish word with its meaning.",
    "options": {
        "left": [
            {"id": "family_match_01_l1", "text": "madre"},
            {"id": "family_match_01_l2", "text": "padre"},
            {"id": "family_match_01_l3", "text": "hermana"},
        ],
        "right": [
            {"id": "family_match_01_r1", "text": "mother"},
            {"id": "family_match_01_r2", "text": "father"},
            {"id": "family_match_01_r3", "text": "sister"},
        ],
    },
    "correct_answer": {
        "pairs": [
            {"left_id": "family_match_01_l1", "right_id": "family_match_01_r1"},
            {"left_id": "family_match_01_l2", "right_id": "family_match_01_r2"},
            {"left_id": "family_match_01_l3", "right_id": "family_match_01_r3"},
        ]
    },
    "metadata": {"hint": "Look for familiar word roots.", "difficulty": 1},
}
```

Quality rules:

- Use 3–4 pairs.
- Every left and right ID appears exactly once in the solution.
- Shuffle public left/right display order in the frontend or start response without changing IDs.

### Fill-blank example

```python
{
    "type": "fill_blank",
    "prompt": "Ella ___ mi hermana.",
    "options": None,
    "correct_answer": {"text": "es"},
    "metadata": {"hint": "Use the verb ser.", "difficulty": 2},
}
```

Quality rules:

- Prompt contains exactly one `___` marker.
- Expected answer is unambiguous under the taught vocabulary.

### Type-answer example

```python
{
    "type": "type_answer",
    "prompt": "Translate ‘Good morning’ into Spanish.",
    "options": None,
    "correct_answer": {
        "accepted": ["Buenos días", "Buenos dias"]
    },
    "metadata": {"hint": "A greeting used before noon.", "difficulty": 1},
}
```

Quality rules:

- Include only genuinely acceptable variants.
- Accent-free variants may be accepted for beginner demo usability.
- Do not add unrelated synonyms simply to make grading easier.

## Content review checklist

Before inserting exercises:

1. Validate every type contract programmatically.
2. Confirm 12 exercises and the required distribution for every skill.
3. Confirm IDs are unique within each exercise and orders are unique within each lesson.
4. Confirm every correct option/pair/tile ID exists.
5. Confirm Spanish accents, punctuation, translations, and grammar manually.
6. Confirm no correct answer leaks into learner start/resume schemas.
7. Confirm all content is original and no Duolingo sentence/copy was reproduced intentionally.

---

## Achievements

Seed six active definitions:

| Key | Title | Criteria | Value | Icon |
|---|---|---|---:|---|
| `first_steps` | First Steps | `skills_completed` | 1 | `footprints` |
| `streak_3` | Building Momentum | `streak_days` | 3 | `small-flame` |
| `streak_7` | A Full Week | `streak_days` | 7 | `calendar-star` |
| `xp_100` | XP Explorer | `total_xp` | 100 | `xp-spark` |
| `xp_500` | XP Trailblazer | `total_xp` | 500 | `xp-crown` |
| `perfectionist` | Perfectionist | `perfect_lessons` | 5 | `target-star` |

Descriptions:

- First Steps: `Complete your first skill.`
- Building Momentum: `Learn for three days in a row.`
- A Full Week: `Reach a seven-day learning streak.`
- XP Explorer: `Earn 100 total XP.`
- XP Trailblazer: `Earn 500 total XP.`
- Perfectionist: `Complete five lessons without a mistake.`

Use original icon keys; create the visual treatment in the frontend design phase.

---

## Seeded users and leaderboard

Seed five users in deterministic total-XP order:

| Rank | Username | Display name | Total XP | Current streak | Longest streak |
|---:|---|---|---:|---:|---:|
| 1 | `leo_demo` | Leo | 520 | 8 | 10 |
| 2 | `asha_demo` | Asha | 410 | 4 | 7 |
| 3 | `maya_demo` | Maya | 340 | 6 | 11 |
| 4 | `noah_demo` | Noah | 290 | 2 | 4 |
| 5 | `sofia_demo` | Sofia | 150 | 1 | 2 |

All users:

- Have the Spanish course as `active_course_id`.
- Have unique `.test` email addresses.
- Have persisted completed-attempt history that sums exactly to `total_xp`.
- Have `user_skill_progress` rows generated from their completion history.
- Receive achievements supported by their history.
- Use deterministic usernames for leaderboard tiebreaking.

The application resolves `maya_demo` as the default learner through configuration, not a magic
numeric ID.

## Default learner: Maya

Seed profile:

```text
username = maya_demo
display_name = Maya
email = maya@example.test
total_xp = 340
current_streak = 6
longest_streak = 11
last_activity_date = reference_date
hearts = 4
max_hearts = 5
heart_regen_anchor_at = reference_now - 7 minutes
gems = 100
daily_goal_xp = 20
is_content_admin = true
```

Today’s seeded XP:

```text
today_xp = 10
daily_goal_progress = 0.5
```

The most recent completed attempt is a normal 10-XP completion with one mistake. This supports
the visible missing heart and regeneration anchor while still extending today's streak.

### Maya's skill progress

| Skill | Successful completions | Crowns | Derived state |
|---|---:|---:|---|
| Greetings | 15 | 5/5 | completed |
| Basics | 12 | 5/5 | completed |
| Food | 2 | 2/5 | in_progress |
| Family | 0 | 0/5 | available |
| Questions | 0 | 0/5 | locked |

This creates all four required visual path states without an active attempt that would interfere
with the evaluator's first click.

### Maya's XP history recipe

Seed 29 successful attempts:

```text
29 base completions × 10 XP = 290 XP
10 perfect bonuses × 5 XP = 50 XP
total = 340 XP
```

Rules:

- Exactly 10 of the 29 attempts have `mistakes_count = 0` and `xp_earned = 15`.
- The other 19 have at least one wrong answer and `xp_earned = 10`.
- Exactly one 10-XP non-perfect attempt completes on `reference_date`.
- Attempts are distributed across a historical 11-day streak, a gap, and the current six-day
  streak ending on `reference_date`.
- `last_activity_date`, current streak, and longest streak must be reproducible from these dates.
- `times_practiced` equals successful completions per skill.
- Crowns equal `min(successful completions, max_level)`.

### Maya's earned achievements

Seed earned rows backed by historical thresholds:

- `first_steps`
- `streak_3`
- `streak_7` — earned during the earlier 11-day streak and remains earned.
- `xp_100`
- `perfectionist`

`xp_500` remains locked at 340/500.

The achievements endpoint may show current streak progress as 6/7 while `streak_7` remains
earned from earlier history. Earned achievements are permanent.

## Additional-user history recipes

Generate completed attempts so every cached XP total is recomputable:

| User | Completed attempts | Perfect attempts | XP formula |
|---|---:|---:|---|
| Leo | 40 | 24 | `40×10 + 24×5 = 520` |
| Asha | 35 | 12 | `35×10 + 12×5 = 410` |
| Noah | 25 | 8 | `25×10 + 8×5 = 290` |
| Sofia | 13 | 4 | `13×10 + 4×5 = 150` |

Distribute completion counts across skills in path order so prerequisites and crown states are
believable. Once a skill reaches five crowns, additional completions are valid replay practice.

Do not create an in-progress attempt for any seeded user. The demo must not unexpectedly resume a
historical lesson.

---

## Historical attempt and answer generation

Every seeded completed attempt includes:

- A valid user and lesson.
- A logical `activity_date` and UTC `completed_at` consistent with its order.
- Exactly 10 unique exercise IDs in `exercise_order`.
- `current_index = 10`.
- `status = completed`.
- Exactly 10 corresponding `exercise_answers` positions from 0 through 9.
- `xp_earned = 15` when perfect, otherwise 10.
- `mistakes_count = 0` when perfect.
- At least one incorrect audit answer when non-perfect.
- `correct_answer_snapshot` and `exercise_type` matching the source exercise at generation time.

For incorrect generated answers:

- Use a valid but wrong option/order/text so the audit record represents a learning mistake.
- Do not use a malformed answer; malformed requests would not create answer rows.

The seed generator may distribute historical mistakes/refills without a separate gem transaction
ledger because the assignment does not model currency transactions. Final hearts/gems must match
the explicit seeded profile.

## Expected core row counts

After a clean seed:

| Table | Expected count |
|---|---:|
| `courses` | 1 |
| `units` | 3 |
| `skills` | 5 |
| `lessons` | 5 |
| `exercises` | 60 |
| `users` | 5 |
| `user_skill_progress` | 25 |
| `achievements` | 6 |
| `lesson_attempts` | 142 completed |
| `exercise_answers` | 1,420 |

`user_achievements` count is determined by each user's supported thresholds and should be printed
in the verification report. There should be no failed or in-progress seed attempt.

Arithmetic check:

```text
29 + 40 + 35 + 25 + 13 = 142 completed attempts
142 × 10 answers = 1,420 answer rows
```

## Post-seed verification report

After commit, print a compact report containing:

1. Row count for every table.
2. Exercise count and per-type distribution for each skill.
3. Invalid exercise-contract count; must be zero.
4. Each user’s stored total XP versus completed-attempt XP sum; differences must be zero.
5. Maya's today XP, streak, hearts/next-heart timestamp, crowns, derived skill states, profile
   counts, and earned achievements.
6. Leaderboard order and current-user rank.
7. Active-attempt count; must be zero.
8. Foreign-key violation check using SQLite `PRAGMA foreign_key_check`; must return no rows.

If any verification fails, raise an error and do not report seed success.

## Idempotency verification

Run the default seed command twice and confirm:

- Core row counts do not increase.
- Existing learner progress/history is not duplicated or silently overwritten.
- Content definitions remain valid.
- XP/cache consistency remains zero-difference.

Run the explicit reset flow in development and confirm it returns to the expected clean counts.

## Seed definition of done

Seed data is complete only when:

1. All 60 exercises pass shared content validation.
2. Each skill contains the exact required type distribution.
3. A new attempt from every skill contains 10 unique exercises and all five types.
4. Every cached XP total equals completed-attempt XP.
5. Maya's crowns, path states, streaks, profile statistics, heart state, goal progress, and
   achievements are supported by persisted data.
6. Leaderboard order is deterministic and Maya is rank three.
7. No in-progress attempt interferes with the evaluator's first lesson.
8. Default rerun is idempotent and destructive reset is development-only and explicit.
9. The seed report shows no foreign-key or contract violations.
10. No real Duolingo asset, audio, or exact copy is included.