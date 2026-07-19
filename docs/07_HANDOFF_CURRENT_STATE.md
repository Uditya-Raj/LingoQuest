# LingoQuest — Current State and Session Handoff

## Purpose

This is the only document that records what is currently implemented. Specifications describe
what LingoQuest must become; this file describes what the repository actually contains today.

Claude must read this file immediately after `.cursor/rules/project-rules.mdc` at the beginning
of every Cursor session. Do not infer implementation status from phase prompts, old chat messages,
README claims, filenames, or generated code that has not been run.

Update this file at the end of every implementation or verification phase. Keep it concise,
factual, and based on evidence.

---

## Status legend

Use only these values:

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No relevant implementation has been verified. |
| `PARTIAL` | Some scope exists, but required behavior or verification is incomplete. |
| `BLOCKED` | Work cannot continue without a decision, credential, dependency, or safe migration. |
| `IMPLEMENTED_UNVERIFIED` | Code exists, but its required checks have not passed in this repository. |
| `VERIFIED` | Required checks passed and the evidence is recorded below. |
| `REGRESSION` | Previously verified behavior is currently broken. |

`IMPLEMENTED_UNVERIFIED` is not equivalent to complete. A phase can be marked `VERIFIED` only
when its exit checks in `/docs/06_IMPLEMENTATION_PHASES.md` pass.

---

## Snapshot

| Field | Current value |
|---|---|
| Product | LingoQuest |
| Repository state | `INSPECTED` |
| Current phase | Phase 11B — Content manager |
| Current phase status | `VERIFIED` |
| Next action | Phase 12 — Required-feature end-to-end gate |
| Recommended model | Claude Sonnet |
| Required skill | None |
| Last updated | 2026-07-19 |
| Updated by | Phase 11B Content manager |
| Active blocker | None |

---

## Specification package status

This table tracks whether the planning files are present, not whether the app is implemented.

| File | Purpose | Presence |
|---|---|---|
| `/docs/00_REQUIREMENTS_TRACEABILITY.md` | Assignment requirement-to-evidence map | **Present** |
| `/docs/00_MASTER_PLAN.md` | Scope, build strategy, and document map | **Present** |
| `/docs/01_ARCHITECTURE.md` | Stack, boundaries, structure, and design decisions | **Present** |
| `/docs/02_DATABASE_SCHEMA.md` | Relational schema, constraints, indexes, and migrations | **Present** |
| `/docs/03_API_SPEC.md` | Endpoint and exercise contracts | **Present** |
| `/docs/04_GAMIFICATION_LOGIC.md` | Hearts, XP, streak, crowns, goals, and achievements | **Present** |
| `/docs/05_SEED_DATA.md` | Deterministic demo content and expected row counts | **Present** |
| `/docs/06_IMPLEMENTATION_PHASES.md` | Model-routed Cursor tasks and exit gates | **Present** |
| `/docs/07_HANDOFF_CURRENT_STATE.md` | Current verified implementation state | **Present** |
| `/docs/08_TESTING_ACCEPTANCE.md` | Automated and manual acceptance matrix | **Present** |
| `/docs/09_DEPLOYMENT.md` | Hosting, persistence, environment, and smoke tests | **Missing** - to be created when deployment phase starts |
| `.cursor/rules/project-rules.mdc` | Always-on Cursor project rules | **Present** |
| `/CLAUDE.md` | Optional Claude Code entry point; not a substitute for Cursor rules | **Present** |
| `.claude/skills/ui-ux-pro-max/SKILL.md` | UX hierarchy, responsive, accessibility skill | **Present** |
| `.claude/skills/frontend-design/SKILL.md` | Visual, 3D primitives, motion skill | **Present** |

---

## Implementation status

Phase 1 scaffolding is complete. Backend foundations through Phase 6B are verified. Phase 7A
schema/seed conformance audit is verified (including migration data-preservation correction).
Phase 7B API/gamification conformance audit is verified. Phase 5B completion audit formally closed.
Phase 7C backend end-to-end HTTP acceptance gate is verified. Phase 8A frontend API foundation is
verified.

| Area | Status | Evidence or remaining work |
|---|---|---|
| Repository scaffolding | `VERIFIED` | Backend and frontend folders created with complete structure. |
| Environment examples and setup | `VERIFIED` | Frontend uses `NEXT_PUBLIC_API_BASE_URL` (normalized in `lib/config.ts`). |
| Database models | `VERIFIED` | Phase 7A: active_course_id FK + leaderboard index added; no stored skill status. |
| Alembic migrations | `VERIFIED` | Head `c8a1f4e2b9d0`. `b7e3c91f2a04` repaired in-place (additive ADD COLUMN). Empty + populated ca24→head preserve 1,420 answers. |
| Deterministic seed/reset | `VERIFIED` | Exact counts, TTS ≥3/skill, XP cache consistent, idempotent reseed; CLI UTC reference_now. |
| Course/path API | `VERIFIED` | GET /api/course returns full path with derived skill states. |
| Skill detail/start/resume API | `VERIFIED` | Standard start/resume unchanged; timed start added. |
| Lesson retrieve API | `VERIFIED` | Timed retrieve returns remaining_seconds; expiry persists time_expired. |
| Exercise answer validation | `VERIFIED` | Pure graders reused; timed wrong answers skip hearts. |
| Lesson completion transaction | `VERIFIED` | Standard + timed paths; rollback hook proof. Phase 5B formally closed by 7B audit. |
| Hearts loss, regeneration, and refill | `VERIFIED` | Standard still loses one heart; timed does not. |
| XP, daily goal, and total consistency | `VERIFIED` | Seed XP cache equals attempt sums. |
| Streak clock logic | `VERIFIED` | Timed completion updates streak; timeout does not. |
| Crowns and server-derived locks | `VERIFIED` | Timed completion does not add crowns/unlocks. |
| Achievement evaluation | `VERIFIED` | Timed completion evaluates achievements. |
| Profile API | `VERIFIED` | Unchanged Phase 6. |
| Leaderboard API | `VERIFIED` | Ordering supported by `ix_users_leaderboard`. |
| Content-management API | `VERIFIED` | Admin create/edit persists and validates tts_text/tts_lang. |
| Debug logical clock | `VERIFIED` | Used for timed expiry boundary tests without sleep(). |
| Timed practice backend | `VERIFIED` | Phase 6B VERIFIED. |
| TTS columns / admin TTS fields | `VERIFIED` | 16 TTS exercises; all five types. |
| Frontend API client/state foundation | `VERIFIED` | Phase 8A: typed contracts, HTTP client, wrappers, session store, Vitest. |
| UX and visual-system blueprint | `VERIFIED` | Phase 8B: `/docs/10_UX_BLUEPRINT.md` — complete 17-section visual direction. |
| 3D design system and primitives | `VERIFIED` | Phase 8C: complete token system, 15 primitives, theme system, Quest mascot, 67 tests. |
| Learning path UI | `VERIFIED` | Phase 9A functional + Phase 9B visual composition. |
| Learning path visual polish | `VERIFIED` | Phase 9B: winding S-curve, SVG connectors, 4 state hierarchy, unit banners, gamification bar, skill detail, Quest fox, responsive, dark mode. Re-verified with inspected screenshots. |
| Lesson player shell and state machine | `VERIFIED` | Phase 10A: pure reducer, `useLessonSession` controller, focused layout, header/progress/hearts/exit, answer/feedback/continue/complete orchestration, failed/completed/error surfaces, timed-mode retrieve boundary. |
| Five exercise renderers | `VERIFIED` | Phase 10B: production `exerciseRenderer` dispatches MC/word-bank/match/fill/type; exact payloads; draft reset; locked during submit/feedback; attempt 143 read-only preserved. |
| Feedback/failure/completion UI polish | `VERIFIED` | Phase 10C: dimensional feedback, solution formatting, out-of-hearts modal + refill/retry, results celebration, toasts, reduced motion. |
| Exercise audio / browser TTS | `VERIFIED` | Phase 10D: Play/Replay via Speech Synthesis; audio_url preferred when present; lifecycle cancel; all five types via ExerciseFrame. |
| Timed practice frontend | `VERIFIED` | Phase 10E: expires_at countdown, GET adjudication, five exercises, timed results, time-expired modal, standard regression. |
| Profile/leaderboard/settings UI | `VERIFIED` | Phase 11A: API-backed `/profile`, `/leaderboard`, `/settings`; achievements on profile; PATCH display_name/daily_goal_xp; Coming Soon placeholders. |
| Content manager UI | `VERIFIED` | Phase 11B: `/admin/content` tree + five exercise editors; create/PATCH; TTS preview; 403/409; Settings permission probe link; 253 frontend tests. |
| Responsive accessibility | `PARTIAL` | Admin + profile/leaderboard/settings inspected at 320/1440 + 200% zoom; full audit in Phase 13. |
| Dark mode bonus | `PARTIAL` | ThemeToggle on settings; admin dark capture taken (polish may remain for Phase 14). |
| Automated test suite | `VERIFIED` | Backend content-admin API **6 passed**. Frontend Vitest **253 passed** (Phase 11B). |
| Production builds | `VERIFIED` | Frontend `next build` passed (Phase 11B); `/admin/content` 18.6 kB route; backend on `:8000`. |
| Deployment and persistent SQLite | `NOT_STARTED` | Deferred; deployment spec missing. |
| README and submission evidence | `NOT_STARTED` | No `README.md` exists. |

---

## Current phase contract

### Phase

Phase 11B — Content manager

### Objective

Replace `/admin/content` placeholder with a functional content manager backed by the existing
administration API: tree browse, exercise create/edit for all five contracts, TTS fields,
merged PATCH, permission and active-attempt conflict handling.

### Model and skill used

**Model:** Cursor Grok / Claude Sonnet tier (contract-heavy; no Max/Opus)
**Skill:** None (reused Phase 8C tokens/primitives; no redesign)

### Admin API inspected (no invention; OpenAPI matches implementation)

| Method | Path | Behavior |
|---|---|---|
| `GET` | `/api/admin/content/tree` | Ordered courses → units → skills → lessons → admin exercises (`correct_answer` included) |
| `POST` | `/api/admin/exercises` | Create exercise; `201`; contract + TTS validation |
| `PATCH` | `/api/admin/exercises/{id}` | Merged patch (`exclude_unset`); full contract revalidation |

**Creatable/editable entities:** exercises only. Course/unit/skill/lesson are browse-only.
**Removal:** `is_active: false` (no delete endpoint).
**Errors:** `403 CONTENT_ADMIN_REQUIRED`, `400 INVALID_EXERCISE_CONTRACT`,
`409 CONTENT_IN_ACTIVE_ATTEMPT`, `409 EXERCISE_ORDER_CONFLICT`, `404` lesson/exercise.
**TTS:** both `tts_text`+`tts_lang` or both null; blank/partial/invalid BCP 47 rejected.
**No contract conflict** between `docs/03_API_SPEC.md` and backend routers/schemas/service.

### Routes / components

| Path | Purpose |
|---|---|
| `app/admin/content/page.tsx` | Content manager shell; permission via tree GET |
| `components/admin/content-manager.tsx` | Layout, selection, unsaved guard, mobile panes |
| `components/admin/content-tree.tsx` | `role="tree"` hierarchy; TTS/inactive cues |
| `components/admin/exercise-editor.tsx` | Create/edit orchestration, PATCH/create submit |
| `components/admin/editors/*` | MC / word-bank / match-pairs / fill-blank / type-answer |
| `components/admin/tts-fields.tsx` | TTS pair + explicit Preview (no autoplay) |
| `components/admin/admin-states.tsx` | Skeleton / error / access denied |
| `components/settings/content-manager-link.tsx` | Settings entry after successful tree probe only |
| `hooks/use-content-manager.ts` | Tree load; 403→forbidden; applyExercise |
| `lib/admin/*` | Option IDs, form state, validation, create/PATCH builders |
| `scripts/phase11b-*.mjs` | Isolated verify, read-only verify, screenshots |

### Supported operations

- Browse full content tree (backend order preserved)
- Create exercise under a lesson (all five types)
- Edit exercise via dirty-field merged PATCH
- Toggle `is_active` (supported removal)
- TTS complete-pair edit + browser Preview
- Metadata JSON advanced editor (invalid JSON blocks save)

Not implemented (API unsupported): delete, reorder bulk, unit/skill/lesson CRUD, publish.

### Permission behavior

- `/admin/content` calls `GET /admin/content/tree`
- Success → manager; `403` → Access denied (not empty tree)
- No admin flag in localStorage; no username/ID inference
- Settings shows Content Manager link only after one successful probe

### Active-attempt protection

- Frontend preserves draft on `409 CONTENT_IN_ACTIVE_ATTEMPT`
- Clear conflict summary + Keep draft / Retry save
- No false success toast; no attempt mutation to force edits

### Test counts (253 total frontend)

| Suite | Tests | Coverage |
|---|---|---|
| `phase11b-content-manager.test.tsx` | 11 | Tree, 403, retry, editors, create payload, 409 draft, unsaved guard, session boundary, TTS/fill validation, word-bank controls |
| `admin-patch.test.ts` | 5 | Create payloads, omit vs null, dirty, TTS/dangling, duplicate words |
| `admin-option-id.test.ts` | 3 | Unique IDs, not indices/text |
| Prior | 234 | Still green |

Backend: `pytest tests/test_phase6_api.py::TestContentAdminAPI -q` → **6 passed**.

### Quality gates

| Command | Result |
|---|---|
| `npm run test` | **253 passed** |
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 warnings/errors) |
| `npm run build` | pass (`/admin/content` included) |

Anti-pattern search: no `@ts-ignore` / `LingoPath` / invented admin endpoints / hardcoded admin
identity / admin answers in Zustand/localStorage / optimistic create-edit success / array-index
option IDs / Duolingo audio suggestions / delete controls / remaining placeholder page.

### Isolated backend verification

`node frontend/scripts/phase11b-isolated-admin-verify.mjs` on temp migrated+seeded DB:

- Tree load Spanish
- Create + prompt-only PATCH for all five types (IDs 61–65); omitted fields preserved
- Partial TTS → `400 INVALID_EXERCISE_CONTRACT`
- Active-attempt PATCH → `409 CONTENT_IN_ACTIVE_ATTEMPT`; attempt stayed `in_progress`
- Learner retrieve excluded `correct_answer`
- Temp DB discarded (development DB not mutated)

Note: isolated seed resumes attempt **143** when starting skill 3; conflict check only PATCHed
an exercise (attempt answers untouched). Development attempt 143 was not used for mutations.

### Real-backend read-only verification

Against development API (`:8000`) — **no POST/PATCH**:

| Check | Result |
|---|---|
| `GET /api/admin/content/tree` | 200; 1 course, 3 units, 5 skills, 5 lessons, 60 exercises |
| Five types present | MC 15, WB 10, MP 10, FB 10, TA 15 |
| TTS pairs | 16 exercises with both fields |
| Admin includes `correct_answer` | yes |
| Attempt **143** | Unchanged `in_progress` before and after tree load |

### Screenshot states / viewports

`qa-screenshots/phase11b/` (14 captures, all `overflow=false`):

- Desktop tree, five editors (MC/WB/MP/FB/TA+TTS), unsaved modal, dark
- Mobile 320 tree / lesson detail / MC editor
- 200% zoom match-pairs
- Access denied (403 mock), active-attempt conflict (409 mock)

Inspected: selected treeitem ring beyond color; admin-only answer labels; sticky save does not
hide conflict banner; match-pair selects keyboard-usable; no horizontal overflow.

### Accessibility results

- Content tree `role="tree"` / `treeitem` with `aria-selected` + keyboard activate
- Form labels; array controls named (Move up/down, Remove option N, pair selects)
- Error summary `role="alert"` + focus; save status `role="status"`
- Unsaved `Modal` focus trap; TTS Preview no autoplay; min-h-11 controls
- Correct-answer regions labeled administrator-only

### Contract gaps

None material vs admin API. Unit/skill/lesson create-edit not exposed by backend (correctly
browse-only in UI).

### Remaining risks

- Full responsive/a11y audit remains Phase 13; final visual polish Phase 14
- Next.js “N” badge may appear in Playwright captures (dev overlay)
- Type change during edit is discouraged in UI (backend allows it only with full contract)
- Settings permission probe adds one tree GET for admins only

### Exact next phase

**Phase 12 — Required-feature end-to-end gate** (`/docs/06_IMPLEMENTATION_PHASES.md`)
**Model:** Claude Sonnet
**Skill:** None

---

## Phase 11A contract (historical — VERIFIED)

Phase 11A delivered API-backed `/profile`, `/leaderboard`, `/settings` with achievements gallery,
PATCH display_name/daily_goal_xp, theme toggle, and Coming Soon placeholders. Evidence: 234
frontend tests at completion; attempt 143 read-only; `qa-screenshots/phase11a/`.

---

## Phase 10E contract (historical — VERIFIED)

Phase 10E delivered Timed Practice countdown, GET expiry adjudication, timed results (20 XP),
and time-expired modal. Evidence: 216 frontend tests at completion; attempt 143 read-only;
`qa-screenshots/phase10e/`.

---

## Phase 10D contract (historical — VERIFIED)

Phase 10D delivered accessible Play/Replay exercise audio via Speech Synthesis with optional
`audio_url` precedence, shared across all five types. See prior handoff evidence: 188 frontend
tests, TTS lifecycle cancel, attempt 143 read-only, `qa-screenshots/phase10d/`.

---

## Phase 10C contract (historical — VERIFIED)

Phase 10C polished Check → Feedback → Continue, out-of-hearts refill/retry, completion results,
celebration, and toast hierarchy. TTS playback was deferred to Phase 10D (now VERIFIED).

---

## Phase 10B contract (historical — VERIFIED)

Phase 10B delivered five production exercise renderers with exact payloads, draft locking,
and attempt 143 read-only preservation. Phase 10C polished feedback/failure/results on top.

---

## Phase 10A contract (historical — VERIFIED)

Phase 10A delivered the lesson shell, pure session reducer, `useLessonSession`, focused layout,
feedback/failed/completed surfaces, and the renderer contract boundary. Production now uses the
Phase 10B `exerciseRenderer` instead of the placeholder default.

---

## Phase 9B contract (historical — VERIFIED)

### Phase

Phase 9B — Learning-path visual composition

### Objective

Visually refine the already-functional learning path and skill-detail experience until it
immediately resembles Duolingo's page composition, feels premium through LingoQuest's 3D system,
uses the Quest fox identity, looks intentional in both themes, and works across all viewports.

### Model and skill used

**Model:** Claude Opus (normal mode)
**Skill:** `frontend-design` — loaded and confirmed before edits. Guided the review toward
quest/exploration grounding, restrained signature emphasis (winding path + current node), chunky
type/depth over dashboard chrome, and critique-from-screenshots rather than code-only judgment.

### Visual issues identified and corrected

| Issue | Correction |
|---|---|
| Path was nearly linear (center-left-center-right) | Changed to 8-step S-curve pattern: center→right→far-right→right→center→left→far-left→left |
| Path connectors were simple vertical divs | Replaced with SVG cubic bezier curves matching node offset positions |
| Connector X positions didn't match node offsets | Tuned SVG coordinates to 30/40/50/60/70 approximating translate-x rhythm |
| Connector height too short for visible curves | Increased to h-14/h-16 with taller viewBox |
| Locked nodes had depth border (blueprint says none) | Removed border-bottom depth; avoid disabled-form look |
| In-progress node used surface bg (less distinctive) | Primary fill + golden ring for current |
| Available pulse ran on current node too (duplicate emphasis) | Pulse only on non-current available; current gets ring+scale+pulse |
| Desktop nav rail too narrow (72px), labels truncated | Widened to 88px with active left-side bar indicator |
| Mobile nav had no active state indicator | Added 3px top bar on active tab |
| Stat indicator for gems had no background | Added subtle `bg-lq-primary/10` background |
| Unit banner mascot collided with copy | Right padding on banner text; mascot 68px with drop-shadow |
| Locked node feedback popup had no 3D depth or icon | Added depth border and Lock icon |
| Loading skeleton didn't suggest winding path | Offset circles mimicking path curve |
| App shell padding didn't match widened nav rail | Updated lg:pl from 72px to 88px |
| Dark-mode node icons nearly black (`text-inverse`) | Brand-filled nodes use `text-white` (surfaces stay bright) |
| Mobile stats wrapped / competed with brand | Header stacks brand then full-width nowrap stats; compact pills |
| Last path nodes sat under bottom nav | Extra path `pb-10` clearance |
| scrollIntoView ignored sticky header | `scroll-mt-28` on current node |
| Mobile skill CTA hard to reach one-handed | Sticky primary Start/Resume above bottom nav (`sm:static`) |
| Screenshot script used wrong skill IDs | Food=`/skill/3`, available Family=`/skill/4`, locked=`/skill/5` |
| Full-page path shots showed sticky bar mid-scroll | Viewport captures centered on `#current-skill-node` |

### Exit evidence

- Winding S-curve path with curved SVG connectors — **inspected in screenshots**
- Four skill states visually distinct and hierarchical — **passed** (all viewports)
- Unit banners with themed gradients and depth — **passed**
- Gamification bar with colored stat pills — **passed** (mobile row no longer wraps awkwardly)
- Skill detail with icon, crown progress, sticky Resume, Timed Practice — **passed**
- Locked skill clearly unavailable with explanation — **passed** (no Start CTA)
- Quest fox on first unit banner and skill detail — **visible**
- No horizontal scrolling at 320px — **passed**
- Dark mode node icon contrast — **passed** after white-ink fix
- Attempt 143 preserved (in_progress, standard, index 0) — **verified via API**
- Typecheck / lint / build / Vitest — **all passed**
- Quality search — **clean** (no LingoPath, no local gamification math, no learner `correct_answer`)

### Screenshot viewports and states inspected

| Viewport | Theme | States |
|---|---|---|
| 1440×900 | light + dark | Path near Food; Food detail; Family available; Questions locked |
| 768×1024 | light | Same four pages |
| 390×844 | light + dark | Same four pages |
| 320×568 | light | Same four pages |

Artifacts under `qa-screenshots/final/` (gitignored). Floating "N" badge in captures is the Next.js
dev indicator, not product UI.

### Accessibility checks (manual + tests)

- Locked nodes do not start lessons; locked feedback uses icon + text
- Primary nav landmarks + `aria-current` active states
- Skill nodes expose status/crowns in accessible names
- Focus-visible rings retained on nodes/nav/buttons
- Reduced-motion: CSS disables continuous pulse; scroll uses `auto` when preferred
- Touch targets: stat pills / nav / nodes ≥44px (`min-h-11` where needed)
- Sticky skill CTA remains keyboard-activatable (same button, repositioned)

### Remaining visual risks

- Path winding amplitude is intentionally modest at 320px to avoid overflow; Phase 14 may tune further
- Desktop skill detail has intentional side whitespace (no right rail on `/skill/[id]`)
- Full responsive/a11y audit still deferred to Phase 13; visual QA screenshots to Phase 14

---

## Verified commands and results

| Date | Category | Command | Result | Notes |
|---|---|---|---|---|
| 2026-07-19 | Phase 10A unit | `cd frontend; npm run test` | **130 passed** | +32 new lesson/reducer/controller/shell tests |
| 2026-07-19 | Phase 10A typecheck | `cd frontend; npm run typecheck` | **pass** | Clean |
| 2026-07-19 | Phase 10A lint | `cd frontend; npm run lint` | **pass** | No ESLint warnings or errors |
| 2026-07-19 | Phase 10A build | `cd frontend; npm run build` | **pass** | Next.js 15.5.20; `/lesson/[attemptId]` 7.95 kB |
| 2026-07-19 | Phase 10A quality | `any` / `@ts-ignore` / `LingoPath` in lesson code | **0** | `expect.any` only in tests |
| 2026-07-19 | Phase 10A quality | retrieve `correct_answer` / local gamification | **0** | Answer response only for solutions |
| 2026-07-19 | Phase 10A smoke | `GET /api/lessons/143` (read-only ×2) | **200** | `in_progress`, standard, index 0; 10 exercises; no `correct_answer` |
| 2026-07-19 | Phase 9B unit | `cd frontend; npm run test` | **98 passed** | Re-run after sticky CTA / dark icon fixes |
| 2026-07-19 | Phase 9B typecheck | `cd frontend; npm run typecheck` | **pass** | Clean |
| 2026-07-19 | Phase 9B lint | `cd frontend; npm run lint` | **pass** | No ESLint warnings or errors |
| 2026-07-19 | Phase 9B build | `cd frontend; npm run build` | **pass** | Next.js 15.5.20 |
| 2026-07-19 | Phase 9B quality | `any` / `@ts-ignore` / `LingoPath` | **0 in app source** | `expect.any` only in tests |
| 2026-07-19 | Phase 9B quality | `correct_answer` in learner UI | **0** | Admin/answer contracts only |
| 2026-07-19 | Phase 9B quality | Local hearts/XP/streak/crown arithmetic | **0** | All backend-derived |
| 2026-07-19 | Phase 9B quality | Duolingo references in code | **0** (1 test icon fallback only) | No copied assets |
| 2026-07-19 | Phase 9B smoke | `GET /api/lessons/143` | **200** | `in_progress`, standard, index 0; no `correct_answer` |
| 2026-07-19 | Phase 9B smoke | OpenAPI title | **LingoQuest API** | Verified on `:8000` |
| 2026-07-19 | Phase 9B screenshots | 24 Playwright captures | **pass** | Inspected after corrections |
| 2026-07-18 | Phase 9A smoke | `POST /api/skills/3/start` | **201** attempt **143** | Historical |
| 2026-07-18 | Phase 8C unit | `cd frontend; npx vitest run` | **67 passed** | button, progress, modal, toast, mascot, stores, client |
| 2026-07-18 | Phase 8A smoke | GET course/me/hearts/leaderboard/achievements on `127.0.0.1:8001` | **200** all | Historical; `:8000` now correct |
| 2026-07-18 | Phase 7C focused | `python -m pytest tests/test_phase7c_acceptance.py -q` | **13 passed** | Fresh Alembic+seed HTTP acceptance |
| 2026-07-18 | all backend | `python -m pytest tests/ -q` | **198 passed** | 185 prior + 13 Phase 7C |
| 2026-07-18 | Alembic head | `python -m alembic heads` | **c8a1f4e2b9d0 (head)** | Unchanged |

---

## Manual verification evidence

For visual or interactive phases, record the viewport and exact flow exercised.

| Date | Screen/flow | Viewport | Result | Evidence/notes |
|---|---|---|---|---|
| 2026-07-19 | Learning path near Food | 1440×900 light/dark | Pass | Rail + right summary; white icons in dark; S-curve + connectors |
| 2026-07-19 | Learning path | 768×1024 light | Pass | Bottom nav; unit banners; Food current |
| 2026-07-19 | Learning path | 390×844 light/dark | Pass | Brand+stats stacked; Food ring+crowns; no overflow |
| 2026-07-19 | Learning path | 320×568 light | Pass | Stats readable; winding offsets; no horizontal scroll |
| 2026-07-19 | Skill Food (attempt 143) | 1440 / 390 light+dark | Pass | Resume sticky on mobile; Timed secondary; crowns 2/5 |
| 2026-07-19 | Skill Family available | 390 light | Pass | Start Lesson primary; Timed Practice secondary |
| 2026-07-19 | Skill Questions locked | 390 light+dark | Pass | Lock icon+copy; no Start CTA |
| 2026-07-18 | Lesson handoff | 390×844 | Pass | Attempt 143 retrieved; no `correct_answer` |

Smoke attempt created during Phase 9A: **attempt_id=143** (Food, standard, `in_progress`, index 0/10). **Still preserved** after Phase 9B (`GET /api/lessons/143` → 200). Do not complete/fail until resume/player testing needs it. Course reports `active_attempt_id=143` on Food.

---

## Database and seed evidence

| Item | Verified value |
|---|---|
| Database engine/path | SQLite at `./lingopath.db` (backend cwd) |
| Current Alembic revision | **c8a1f4e2b9d0** (head) |
| Prior revisions | ca24b65a41a3 → b7e3c91f2a04 → c8a1f4e2b9d0 |
| SQLite foreign keys enabled | Yes — connect pragma + PRAGMA foreign_key_check empty |
| Seed command | `python -m app.seed.seed_data [--reference-date YYYY-MM-DD] [--reset --yes]` |
| Seed rerun behavior | Updates safe content definitions without duplicating learner history |
| Default learner | Maya (maya_demo) — 340 XP, streak 6/11, hearts 4/5, gems 100, goal 20, rank 3, admin |
| Expected row counts | YES — courses 1, units 3, skills 5, lessons 5, exercises 60, users 5, progress 25, achievements 6, attempts 142 completed / 0 active, answers 1,420 |
| user_achievements | **22** (supported-threshold count from verification report) |
| TTS seed | 16 TTS: Greetings 4, others 3 each; all five types; `tts_lang=es-ES` |
| XP consistency | ALL USERS — stored total_xp equals completed-attempt XP sum |
| Exercise distribution | ALL SKILLS — 12 each with required type mix |
| Contract validation | Shared validators; 0 invalid contracts on seed |
| Active attempts | Zero |
| users.active_course_id FK | **Present** — `ON DELETE SET NULL` (Phase 7A) |
| ix_users_leaderboard | **Present** — `(total_xp, username, id)` |
| user_skill_progress.status | **Absent** (derived only) |
| Runtime create_all() | Not used under `app/` |
| Attempt backfill (6B) | Existing attempts → `mode=standard`; failed standard → `failure_reason=out_of_hearts` |
| Local data preservation | **Local `lingopath.db` already lost answers** under the old b7e3 body (142 attempts, 0 answers). Not reset during this correction. Future upgrades need no reset. |

### Compatibility impact

| Item | Detail |
|---|---|
| Root cause | `b7e3c91f2a04` used `op.batch_alter_table("lesson_attempts")`, which on SQLite rebuilds the table. With FKs ON, dropping the old `lesson_attempts` CASCADE-deleted all `exercise_answers`. |
| Exact correction | Same revision ID `b7e3c91f2a04` / down_revision `ca24b65a41a3`. Replaced batch rebuild with native `ALTER TABLE … ADD COLUMN` for `mode`, `expires_at`, `failure_reason`, `tts_text`, `tts_lang`, plus column CHECK constraints and backfill UPDATEs. Downgrade uses `DROP COLUMN` under `PRAGMA foreign_keys=OFF`. |
| Pre-release exception | Repository is pre-release with no external production databases. In-place repair of an already-shipped revision ID is explicitly allowed here because a later forward migration cannot restore arbitrary answers already deleted. |
| Before/after (temp populated ca24) | Before b7e3: attempts=142, answers=1420. After old body: answers=0. After repaired body → head: attempts=142, answers=1420, progress=25, user_achievements=22, XP sum unchanged, mode backfilled to `standard`. |
| Phase 7A migration safety | `c8a1f4e2b9d0` still sets `PRAGMA foreign_keys=OFF` around users batch rebuild. |
| Local `lingopath.db` recovery | Disposable seeded dev DB already wiped. Safe recovery (not run in this phase): from `backend/`, `python -m app.seed.seed_data --reset --yes --reference-date 2026-07-18`. Do not use this to “prove” preservation — use the temp-DB regression test. |

---

## API contract evidence

Fill the result and test reference after each endpoint group is verified.

| Contract group | Result | Test or command reference |
|---|---|---|
| Course path and derived locks | **Verified** | `test_phase4_api.py::TestCourseAPI` |
| Skill detail/start/retrieve/resume | **Verified** | `test_phase4_api.py` start/retrieve suites |
| Timed start | **Implemented** | `test_phase6b_timed_api.py::TestTimedStart` |
| Lazy heart regeneration | **Verified** | Phase 4 + Phase 6 hearts status regen |
| All five answer shapes | **Verified** | `test_answer_grading.py` + `test_phase5a_api.py` |
| Attempt ordering/idempotency/conflicts | **Verified** | Phase 5A API suite |
| Timed answer/expiry | **Implemented** | `test_phase6b_timed_api.py` |
| Completion transaction | **Verified** | Phase 5B + 6B + Phase 7C HTTP complete/idempotency/concurrency |
| Hearts status/refill | **Verified** | Phase 6 + Phase 7C zero-heart/refill/regen |
| User profile/settings | **Verified** | Phase 6 + Phase 7C seed/patch/today XP |
| Leaderboard | **Verified** | Phase 6 + Phase 7C post-completion rank/XP |
| Achievements | **Verified** | Phase 6 + Phase 7C earned/locked consistency |
| Content management + TTS | **Verified** | Phase 6/6B + Phase 7C admin create/edit/TTS/protection |
| Debug clock safety | **Verified** | Absent when disabled; Phase 7C uses injectable clock |
| Standard error envelope/status codes | **Verified** | Phase 7C: 400/403/404/409 + ownership |
| End-to-end HTTP acceptance | **Verified** | `tests/test_phase7c_acceptance.py` — 13 passed |

---

## Frontend evidence

Do not begin visual polish until the dependent API contracts are verified. When frontend work
starts, use only the two installed project skills:

```text
.claude/skills/ui-ux-pro-max/SKILL.md
.claude/skills/frontend-design/SKILL.md
```

If either path is missing, record a blocker and continue only with work that does not depend on
that skill. Do not substitute or reference invented skills.

| Frontend area | Functional evidence | Visual evidence | Result |
|---|---|---|---|
| Shared API/error/session handling | Typed client + ApiError + session store; Vitest 22 | Not applicable | **Verified** (Phase 8A) |
| 3D primitives/design tokens | 15 primitives + full token system + 45 component tests | Dev showcase at `/design-system` | **Verified** (Phase 8C) |
| Learning path | GET course → winding path, four states, gamification bar | Screenshots 1440/768/390/320 light+dark | **Verified** (Phase 9A) |
| Skill detail / start | GET skill + POST start/start-timed → `/lesson/{id}` | Skill screenshots; attempt 143 | **Verified** (Phase 9A) |
| Lesson player | Handoff retrieves attempt only | Lesson handoff screenshot | Partial (Phase 10A next) |
| Profile | Shell nav only; body deferred | — | Partial |
| Leaderboard | Shell nav only; body deferred | — | Partial |
| Settings/daily goal | Theme toggle live; goal edit deferred | Settings route | Partial |
| Content manager | Placeholder `/admin/content` | — | Not verified |
| Empty/loading/error states | Path + skill + handoff loading/error/retry | Exercised in tests + UI | **Verified** (path/skill) |
| Keyboard/focus/reduced motion | Nav landmarks, node focus, reduced-motion pulse off | Manual + tests | Partial (full audit Phase 13) |
| Dark mode | Tokenized path/shell; settings ThemeToggle | 1440/390 dark screenshots | Partial |

Visual quality must be evaluated from running screenshots, not inferred from component source.

---

## Decisions made during implementation

Specifications already contain planned architecture decisions. Record only new repository-level
decisions or approved deviations discovered while implementing.

| Date | Decision | Reason | Affected files/specs |
|---|---|---|---|
| 2026-07-18 | Use `exercise_metadata` Python attribute mapped to `metadata` column | `metadata` is reserved in SQLAlchemy Declarative API | `backend/app/models/course.py` (Exercise model) |
| 2026-07-18 | Remove cascade="all, delete-orphan" from RESTRICT foreign keys | SQLAlchemy cascade would bypass database RESTRICT constraints | All model relationship definitions |
| 2026-07-18 | Phase 3B: Audio and timed practice moved from deferred to required | Final HR assignment labels all bonus items as required | All specification documents, R-13 through R-17 renumbered |
| 2026-07-18 | Phase 3B: Exercise audio uses browser Speech Synthesis TTS | Zero-cost TTS via speechSynthesis API; audio_url for future original audio | Schema, API, seed, requirements, testing |
| 2026-07-18 | Phase 3B: Timed practice is 120-second challenge mode | Backend expires_at enforcement; fixed 20 XP; no hearts consumed; no crowns/unlocks | Schema, API, gamification, requirements, phases, testing |
| 2026-07-18 | Phase 3B: Toasts and mascot flourishes made explicit in R-16 | Visual requirements previously implicit now documented | Requirements R-16 acceptance criteria |
| 2026-07-18 | Phase 4: Use simplified get_current_user() returning Maya | Authentication simplified for demo; proper user-scoped queries preserved | `backend/app/dependencies/auth.py` |
| 2026-07-18 | Phase 4: SQLite datetimes may be timezone-naive | Added `ensure_utc_aware()` helper to handle both naive and aware datetimes | `backend/app/services/hearts.py` |
| 2026-07-18 | Phase 4: Standard error envelope with code/message/details | All domain errors use structured envelope per API spec | `backend/app/core/errors.py`, all routers |
| 2026-07-18 | Phase 5A: Graders are mode-agnostic; answer path is standard-only | Phase 6B extends without duplicating graders | `answer_grading.py`, `lesson_engine.submit_answer` |
| 2026-07-18 | Phase 5B: Completion uses conditional UPDATE claim (`status=in_progress`) | Concurrent completes produce one success + ATTEMPT_ALREADY_COMPLETED | `lesson_engine.complete_attempt` |
| 2026-07-18 | Phase 5B: Heart refill is service-only | HTTP GET/POST hearts endpoints remain Phase 6 | `hearts.refill_hearts` |
| 2026-07-18 | Phase 5B: Test-only `_completion_failure_hook` for rollback proof | Required integration scenario without weakening production path | `lesson_engine.set_completion_failure_hook` |
| 2026-07-18 | Phase 6: Debug routes gated by `DEBUG_CLOCK_ENABLED` (env) | Matches existing config; routes unregistered (404) when false | `config.py`, `main.py`, `routers/debug.py` |
| 2026-07-18 | Phase 6: `require_content_admin` centralized dependency | Non-admins get 403 CONTENT_ADMIN_REQUIRED | `dependencies/auth.py` |
| 2026-07-18 | Phase 6B: Forward migration `b7e3c91f2a04` only | Never rewrite initial migration; backfill mode/failure_reason | `alembic/versions/b7e3c91f2a04_*.py` |
| 2026-07-18 | Phase 6B: Expiry when `logical_now > expires_at` | Exact equality still playable; matches gamification spec | `lesson_engine._is_timed_expired` |
| 2026-07-18 | Phase 6B: TTS both-or-neither + BCP 47 pattern | Reject blank text and invalid language tags | `seed/validators.py` |
| 2026-07-18 | Phase 6B: Seed updates existing exercise definitions on reseed | Applies TTS without touching learner history | `seed/seed_data.py` |
| 2026-07-18 | Phase 6B: Concurrent timed starts keep earliest attempt | Delete extra empty in_progress attempts for same user/skill | `lesson_engine.start_timed_practice` |
| 2026-07-18 | Phase 7A: Forward migration `c8a1f4e2b9d0` with FK OFF around users rebuild | Spec requires active_course_id FK + leaderboard index; SQLite batch rebuild would CASCADE-wipe children if FKs stayed on | `c8a1f4e2b9d0_*.py`, `models/user.py` |
| 2026-07-18 | Phase 7A: Seed CLI uses `timezone.utc` for reference_now | Schema requires UTC timestamps; CLI previously used local offset | `seed/seed_data.py` |
| 2026-07-18 | Phase 7A correction: in-place repair of `b7e3c91f2a04` to additive ADD COLUMN | Pre-release only; batch rebuild CASCADE-wiped answers; later migration cannot restore deleted answers | `b7e3c91f2a04_*.py`, `test_phase7a_data_preservation.py` |

If a decision changes an API, schema, gamification rule, acceptance criterion, or deployment
contract, update the source specification in the same phase. This handoff is not a replacement
for correcting the source document.

---

## Known issues and blockers

| Severity | Issue | Impact | Owner/action | Status |
|---|---|---|---|---|
| Info | `/docs/09_DEPLOYMENT.md` not yet created | No impact until deployment phase | Create when Phase 15 starts | Open |
| Resolved | Stale LingoPath API on :8000 | Confused local frontend | Restarted LingoQuest `app.main:app` on 8000 in Phase 9A | Resolved 2026-07-18 |
| Info | Profile API omits `is_content_admin` | Desktop admin nav cannot be gated from profile | Omit admin link until contract adds flag; do not invent | Open |
| Info | Smoke attempt **143** (Food, in_progress) | Resume testing; path shows Food active | Preserve; do not complete in 9A; optional isolated cleanup later | Open (intentional) |
| Info | Phase 6B Sonnet audit completed | All migration/TTS/timed contracts verified | Phase 6B marked VERIFIED | Resolved 2026-07-18 |
| Info | Phase 5B formal Sonnet audit not separately recorded | Completion path covered by tests; **Phase 7B closed API/gamification conformance** | Phase 7B | Resolved 2026-07-18 |
| Info | No DB unique constraint preventing dual in_progress attempts | Service-level race cleanup proven | Acceptable for SQLite demo | Resolved 2026-07-18 |
| Info | Local `lingopath.db` still has 0 answers from historical wipe | Dev-only; does not block future upgrades | Optional `--reset --yes` recovery (not run in this phase) | Open (dev recovery) |
| Resolved | Phase 6B migration wiped `exercise_answers` on populated upgrade | Blocked honest 7A VERIFIED | In-place additive repair + regression test | Resolved 2026-07-18 |

---

## Phase 7A Audit findings

### Severity-ranked gaps (pre-fix)

| Severity | Gap | Evidence | Resolution |
|---|---|---|---|
| HIGH | `users.active_course_id` lacked FK to `courses.id` ON DELETE SET NULL | Model `user.py`; migration `ca24b65a41a3`; `PRAGMA foreign_key_list(users)` empty | Forward migration `c8a1f4e2b9d0` + model FK |
| HIGH | `b7e3c91f2a04` batch-alter wiped `exercise_answers` on populated ca24→upgrade | Repro: 1420→0 answers with FKs ON | In-place repair to native ADD COLUMN (pre-release exception) |
| MEDIUM | Missing `ix_users_leaderboard` | Schema “Deterministic leaderboard ordering”; index list lacked name | Added in `c8a1f4e2b9d0` + model Index |
| LOW | Seed CLI `reference_now` used local TZ | Seed report showed `+05:30` | CLI now uses `timezone.utc` |

### Schema audit (PASS after fix)

- ✓ No stored `user_skill_progress.status`
- ✓ SQLite FKs enabled on every connection; `foreign_key_check` empty
- ✓ users heart/XP/streak/gem/goal checks present
- ✓ Course/unit/skill/lesson ordering uniqueness + indexes
- ✓ Exercise-type checks; `audio_url` / `tts_text` / `tts_lang`
- ✓ Attempt status/mode/expires_at/failure_reason checks
- ✓ Answer position/exercise uniqueness + type checks
- ✓ user_skill_progress uniqueness + crown/practice checks
- ✓ Achievement criteria + user-award uniqueness
- ✓ Required CASCADE/RESTRICT policies (including active_course SET NULL)
- ✓ Leaderboard index present; active-attempt indexes present
- ✓ Runtime does not depend on `create_all()` under `app/`

### Migration audit (PASS after data-preservation correction)

- ✓ Initial `ca24b65a41a3` intent unchanged
- ✓ `b7e3c91f2a04` repaired in-place (same ID); additive columns; no lesson_attempts rebuild
- ✓ Empty temp DB upgrades base→head to `c8a1f4e2b9d0`
- ✓ Populated ca24 (142 attempts / 1,420 answers) upgrades to head with all answers preserved
- ✓ Pre-6B attempts backfill `mode=standard`
- ✓ Pre-7A DB upgrades b7e3→c8a1; orphans cleared; child rows preserved when FK OFF
- ✓ Alembic current equals head
- ✓ No reset required for future populated upgrades
- ✓ Local developer DB not reset during correction (already missing answers)

### Seed audit (PASS)

- ✓ Exact clean-seed counts (user_achievements=22 supported)
- ✓ Five progress rows/user; 12 exercises/skill; type distribution
- ✓ Shared contract validation; ≥3 TTS/skill; all five types TTS-capable
- ✓ Maya profile/path/heart/goal/streak; rank 3; XP cache consistent
- ✓ Zero active/failed seeded attempts
- ✓ Idempotent second seed; reset remains `--reset --yes` + non-production

### Test coverage

- Schema FK/index/status-column tests
- Phase 6B / 7A migration tests
- **Mandatory** `test_phase7a_data_preservation.py` (142/1420 ca24→head)
- Full suite: **185 passed**

---

## Phase 7B API and Gamification Audit

### Initial gap list (read-only audit)

| Severity | Gap | Evidence | Resolution |
|---|---|---|---|
| LOW | API title uses "LingoPath" instead of "LingoQuest" | `main.py:25-26` FastAPI title/description | Updated to "LingoQuest API" for repository consistency |

### API Contract Audit (PASS)

- ✅ All 20 endpoint groups match `/docs/03_API_SPEC.md`
- ✅ Exact Pydantic response models
- ✅ Standard error envelope `{"error": {"code", "message", "details?"}}`
- ✅ Real HTTP status codes (400/403/404/409/422/500), never 200 with embedded error
- ✅ Debug routes completely absent when `DEBUG_CLOCK_ENABLED=false`
- ✅ No endpoint returns 501 or fake success

### Architecture Audit (PASS)

- ✅ Routers thin (validate, resolve, call service, return)
- ✅ Business rules in services (lesson_engine, hearts, xp, streak, skill_progress, achievements, etc.)
- ✅ Current-user resolution centralized in `dependencies/auth.py`
- ✅ All attempts/progress/settings/admin user-scoped
- ✅ Foreign attempt IDs return safe 404
- ✅ Single injected logical clock from `core/clock.py`
- ✅ No direct `datetime.now()` calls in domain services

### Course, Skill, Attempt Lifecycle (PASS)

- ✅ GET /api/course derives all four states without stored status column
- ✅ Standard start: 201 new / 200 resume, locked/zero-heart checks, stratified 10 exercises
- ✅ Timed start: mode=timed, expires_at=now+120s, no heart check
- ✅ Retrieve: refresh restores order/index, enforces timed expiry, no answers exposed
- ✅ Concurrent start protection (keeps earliest, deletes extras)

### Answer Audit (PASS)

- ✅ All five graders match exact contracts with proper normalization
- ✅ Graders pure (no mutation), return `GradeResult`
- ✅ Standard wrong answer loses one heart
- ✅ Timed wrong answer loses no heart
- ✅ Zero-heart standard fails in same response
- ✅ Malformed/stale/duplicate inputs deduct no heart
- ✅ Concurrent duplicate prevented by DB uniqueness

### **FORMAL PHASE 5B COMPLETION AUDIT (PASS)**

**✅ PHASE 5B FORMALLY CLOSED AND VERIFIED**

**One-transaction atomic completion:**
1. ✅ Single clock capture (`now`, `today`)
2. ✅ Conditional UPDATE claim (`WHERE status='in_progress'`)
3. ✅ Idempotent protection (rowcount check → ATTEMPT_ALREADY_COMPLETED)
4. ✅ Early/failed/completed conflicts checked before mutation
5. ✅ Standard XP: `base + floor(base * 1/2)` when perfect
6. ✅ Timed XP: fixed 20, no perfect bonus
7. ✅ Total XP cache updated in same transaction
8. ✅ Today XP/goal uses logical `activity_date`
9. ✅ Streak transitions (same/next/missed day rules)
10. ✅ Longest streak never decreases
11. ✅ Standard: crown+1 (capped), practice+1, genuine unlocks
12. ✅ Timed: practice+1 only, no crowns/unlocks
13. ✅ Achievement evaluation uses updated user state
14. ✅ Achievement idempotency (unique constraint + savepoint)
15. ✅ Concurrent completion: conditional UPDATE serializes
16. ✅ Injected failure rollback proven (test hook at line 759)
17. ✅ Retry after rollback succeeds once

**Completion result contract:**
- ✅ All fields from spec present: attempt_id, skill, xp, streak, daily_goal, unlocked_skill_ids, achievements_unlocked, user_totals, completed_at
- ✅ Mode-specific rules: standard (hearts check, crowns, unlocks), timed (fixed 20 XP, practice only, no crowns)

**Test coverage:**
- ✅ `test_phase5b_api.py`: 11 tests (early/failed/duplicate/concurrent/rollback)
- ✅ `test_phase6b_timed_api.py`: 6 completion tests (20 XP/no crown/no bonus/expiry/concurrent/rollback)

### Hearts, Profile, Leaderboard, Achievements (PASS)

- ✅ Hearts: lazy regen preserves remainder, caps at max, refill atomic
- ✅ Profile: skills_completed (crowns>=max), lessons/perfect counts, today_xp
- ✅ Leaderboard: total_xp DESC, username ASC, id ASC; Maya rank 3; current user always returned
- ✅ Achievements: criteria evaluation, unique constraint, inactive not awarded

### Content and TTS (PASS)

- ✅ Admin: tree/create/edit with shared validation, active-attempt protection
- ✅ TTS: 16 exercises seeded, both-or-neither validation, BCP 47 pattern
- ✅ Public routes never expose correct_answer (admin routes include it)

### Timed Practice (PASS)

- ✅ Backend expires_at control, remaining_seconds server-derived
- ✅ Exact boundary: `logical_now > expires_at`
- ✅ Retrieve/answer/complete enforce expiry
- ✅ Successful: 20 XP, streak, practice, no crowns/unlocks
- ✅ Timeout: no XP/streak/achievements
- ✅ Concurrent start protection proven

### Naming Consistency

- ✅ API title updated from "LingoPath API" to "LingoQuest API"
- ✅ Database name `lingopath.db` (local dev convention, not user-facing)
- ✅ Migration/model filenames (not user-facing, intentionally unchanged)

### Test Evidence

- ✅ 185 backend tests collected
- ✅ **185 passed** in 215.97s
- ✅ Coverage: graders, hearts, streak, xp, crowns, achievements, answer, completion (standard/timed), timed-specific, content-admin, debug-clock, schema, seed, migrations
- ✅ 25 schema tests passed after fix verification

---

## Files changed in the latest phase

Phase 10C lesson feedback / failure / results visual pass:

| File | Change | Reason |
|---|---|---|
| `frontend/components/lesson/lesson-feedback-region.tsx` | Updated | Cadence, hearts, solution UI, Finish/Continue |
| `frontend/components/lesson/lesson-failed-surface.tsx` | Updated | OOH modal + refill/retry; timed separate |
| `frontend/components/lesson/lesson-completed-surface.tsx` | Updated | Results celebration from CompletionResponse |
| `frontend/components/lesson/celebration-burst.tsx` | Created | Decorative reduced-motion-safe sparks |
| `frontend/components/lesson/lesson-hearts.tsx` | Updated | Heart-loss pulse from response delta |
| `frontend/components/lesson/lesson-player.tsx` | Updated | Check/Continue swap; completing; toasts |
| `frontend/components/lesson/lesson-layout.tsx` | Updated | Hide action bar during feedback |
| `frontend/components/ui/feedback-surface.tsx` | Updated | Dimensional feedback polish + reduced motion |
| `frontend/lib/lesson/format-solution.ts` | Updated | Safe structured five-type formatting |
| `frontend/lib/lesson/feedback-copy.ts` | Created | Original LingoQuest phrases |
| `frontend/stores/session-store.ts` | Updated | `applyRefill` |
| `frontend/app/globals.css` | Updated | Celebration + heart-loss keyframes |
| `frontend/tests/components/phase10c-*.test.tsx` | Created | Feedback/failure/refill/results coverage |
| `frontend/tests/lesson/format-solution.test.ts` | Created | Solution formatting unit tests |
| `frontend/scripts/phase10c-feedback-screenshots.mjs` | Created | Screenshot QA (mocked) |
| `docs/07_HANDOFF_CURRENT_STATE.md` | Updated | Phase 10C VERIFIED evidence |

### API endpoints connected (this phase)

- `POST /api/hearts/refill` (new UI wiring)
- `POST /api/skills/{id}/start` (retry after refill)
- Existing answer/complete remain authoritative for feedback/results

---

## Working tree safety

| Check | Result |
|---|---|
| Current branch | `main` |
| Pre-existing unrelated edits | Preserved |
| Files changed this phase | Profile/leaderboard/settings UI, hooks, session `applyUserPatch`, tests, screenshots, handoff |
| Backend production code | **Unchanged** |
| Attempt 143 | Read-only; unchanged (`in_progress`, index `0`, `mode=standard`) |

---

## Exact next request for Cursor

Phase 11B is VERIFIED. Use this request next:

```text
Perform LingoQuest Phase 12: required-feature acceptance gate.

Follow the Common phase protocol. Run every MUST acceptance workflow against the real frontend,
backend and seeded SQLite database. Add/fix automated tests and manually verify browser flows at
desktop and mobile baseline.

Build a requirement-to-evidence table in the handoff. Fix in-scope failures one category at a
time. Do not start optional bonuses while any MUST item is red.
```

**Recommended model:** Claude Sonnet  
**Required skill:** None

---

## Phase 8A evidence (historical)

### Scaffold mismatches corrected

| Issue | Correction |
|---|---|
| Env var `NEXT_PUBLIC_API_URL` | Renamed to architecture/spec `NEXT_PUBLIC_API_BASE_URL` |
| Incomplete ApiError / client | Full envelope parsing, status/code/message/details, AbortSignal |
| Only health contracts | Full learner/admin/debug contracts |
| Package/UI named LingoPath | Renamed to LingoQuest in user-facing frontend |
| No Vitest | Added minimal Vitest + 22 tests |

### API modules and wrappers

- **Client:** `lib/api/client.ts` (`apiRequest` / `apiGet` / `apiPost` / `apiPatch`, `ApiError`)
- **Course:** `getCourse`, `getSkill`
- **Lessons:** `startLesson`, `startTimedPractice`, `getAttempt`, `submitAnswer`, `completeLesson`
- **Learner:** `getHeartsStatus`, `refillHearts`, `getCurrentUser`, `updateCurrentUser`, `getLeaderboard`, `getAchievements`
- **Admin:** `getContentTree`, `createExercise`, `updateExercise`
- **Debug (separated):** `getDebugClock`, `advanceDebugClock`, `resetDebugClock`
- **Health:** `getHealth`, `getReady`

### Quality search counts (frontend source)

| Check | Count / result |
|---|---|
| `\bany\b` in lib/stores/tests/app | **0** |
| `@ts-ignore` / `@ts-expect-error` | **0** |
| Scattered hard-coded API base in components | **0** (localhost only in config error text, `.env.example`, Vitest setup/assertions) |
| `LingoPath` / `lingopath` in frontend TS/TSX | **0** |
| `correct_answer` on public exercise types | **Absent**; present only on admin contracts + answer response (reveal) |

### Backend smoke (read-only)

Port **8000** hosted a stale Phase-1 “LingoPath API” with only `/health` and `/ready`. Smoke ran against the **current** app on `127.0.0.1:8001` (OpenAPI title **LingoQuest API**, 17 paths) using the existing seeded `lingopath.db`. No lesson start/complete.

| Endpoint | Status | Field match vs TS contracts |
|---|---|---|
| GET `/api/course` | 200 | learner/course/units/skill keys match |
| GET `/api/user/me` | 200 | user/stats/achievements match |
| GET `/api/hearts/status` | 200 | hearts/max/next/seconds/regen match |
| GET `/api/leaderboard` | 200 | ranking_basis/entries/current_user match |
| GET `/api/achievements` | 200 | criteria + earned fields match |

### Contract mismatches

None requiring a type or backend fix for the smoke endpoints.

**Informational (backend frozen):** written API_SPEC health examples differ from live health (`status: "healthy"` without `service`; ready `database: "connected"`). Frontend health types match the live backend. Not changed in this phase.

### Remaining risks (Phase 8A historical; superseded where noted)

- ~~Stale uvicorn on port 8000~~ — **Resolved in Phase 9A** (LingoQuest API restarted on `:8000`)
- Developer DB historically wiped answers (recovered to 1420) — open for optional reset recovery
- Deployment / R-17 still deferred

---

## Phase 8C implementation details (historical)

### Token system

- **Source of truth:** CSS custom properties in `app/globals.css` (`:root` for light, `.dark` for dark)
- **Tailwind integration:** `tailwind.config.js` extends colors, radii, shadows, z-index, maxWidth, fontSize via `var()` references
- **Dark mode strategy:** Tailwind `darkMode: 'class'`; `ThemeScript` inline script prevents flash before React hydration

### Typography

- **Font:** `@fontsource-variable/nunito` (npm package, open-licensed, no build-time download)
- **Scale:** 8 sizes from `lq-xs` (12px) to `lq-4xl` (36px) with line-height pairs
- **Weights:** 400 (normal) through 800 (extrabold)
- **Fallbacks:** `'Nunito Variable', 'Nunito', system-ui, -apple-system, sans-serif`

### 3D interaction system

- **Mechanic:** CSS `border-bottom` (colored depth edge) + `box-shadow` + `translateY` on press
- **Depths:** 4 levels (sm=2px, md=4px, lg=6px, xl=8px) as CSS custom properties
- **States:** resting, hover (lift -1px), pressed (translateY by depth + border-b collapse), selected, disabled (opacity), loading, focus-visible (outline offset)
- **Reduced motion:** Global `prefers-reduced-motion: reduce` removes all transitions/animations

### Primitives implemented (15 total)

| Primitive | Purpose |
|---|---|
| `Button3D` | Primary CTA with 6 variants, 3 sizes, loading/disabled |
| `IconButton3D` | Circular icon button with active state |
| `SurfaceCard` | Container with default/elevated/interactive variants |
| `ChoiceTile` | Radio-style answer choice with state feedback |
| `WordTile` | Word bank tile with available/placed states |
| `MatchTile` | Match pair tile with paired/correct/used states |
| `StatusBadge` | Small semantic badge (6 variants) |
| `StatIndicator` | Icon+number pill for hearts/streak/XP/gems/crowns |
| `ProgressBar` | Horizontal fill with accessible aria semantics |
| `ProgressRing` | SVG circular crown progress ring |
| `Modal` | Focus-trapping dialog with Motion spring entrance |
| `ToastProvider` + `useToast` | Queue-managed toast system (max 2 visible) |
| `FeedbackSurface` | Bottom correct/incorrect feedback with slide-up |
| `Skeleton` | Shimmer loading placeholder (text/circular/rectangular) |
| `ThemeToggle` | Light/dark/system preference radio group |
| `QuestMascot` | Original fox SVG with 4 expression variants |

### Quest mascot

- **Type:** Inline SVG, no external image dependency
- **Character:** Fox with warm orange body (#F0972B), cream markings (#FCEBD0), teal bandana (#2BB5A0)
- **Variants:** neutral, encouraging (raised brows, tail tilt), celebrating (bounce, stars, big smile), concerned (worried brows, flat mouth)
- **Accessibility:** Decorative by default (`aria-hidden`, `role="presentation"`); labeled mode available
- **Maintainable:** ~120 lines of readable SVG with clear shape composition

### Dependencies added

| Package | Type | Reason |
|---|---|---|
| `@fontsource-variable/nunito` | runtime | Nunito variable font without build-time download |
| `clsx` | runtime | Conditional class composition |
| `tailwind-merge` | runtime | Tailwind class conflict resolution |
| `lucide-react` | runtime | Open-source icon set (Lucide, not Duolingo) |
| `@testing-library/react` | dev | Component test rendering |
| `@testing-library/jest-dom` | dev | DOM assertion matchers |
| `@testing-library/user-event` | dev | User interaction simulation |
| `jsdom` | dev | DOM environment for Vitest |
| `@vitejs/plugin-react@4` | dev | JSX transform for Vitest |

### Test counts (98 total)

| Test file | Tests | Coverage |
|---|---|---|
| Phase 9A path/skill/handoff/home | 31 | Course load, four states, crowns, locked, start/resume/timed, handoff |
| `button-3d.test.tsx` | 16 | Variants, sizes, disabled, loading, keyboard, className |
| `progress.test.tsx` | 6 | Aria attributes, clamping, max=0 safety |
| `modal.test.tsx` | 7 | Open/close, dialog role, focus trap, Escape, non-dismissible |
| `toast.test.tsx` | 4 | Add, queue limit, dismiss, auto-dismiss |
| `mascot.test.tsx` | 7 | Decorative, labeled, variants, sizing |
| `ui-store.test.ts` | 5 | Theme preference, dark class toggle, no learner state |
| `session-store.test.ts` | 4 | Prior Phase 8A tests (unchanged) |
| `client.test.ts` | 18 | Prior Phase 8A tests (unchanged) |

---

## End-of-phase update checklist

Before ending any Cursor phase, update all applicable items:

- Snapshot: phase, status, next action, model, skill, date, blocker.
- Implementation status rows affected by the phase.
- Commands with concise results and exit codes/test counts.
- Manual flows and viewports actually exercised.
- Database/API/frontend evidence relevant to the phase.
- New decisions and specification corrections.
- Known issues with severity and action.
- Files changed in the phase.
- Working-tree overlap or preservation notes.
- Exact next Cursor request.

Then give the user a short phase report containing:

1. Outcome.
2. Files changed.
3. Verification performed and results.
4. Remaining blockers or risks.
5. Exact next phase and recommended model/skill.

Do not paste this entire handoff into chat. Keep the authoritative current state in this file.

---

## Maintenance rules

- Replace stale facts; do not append endless session diaries.
- Preserve only the latest useful command evidence plus unresolved historical issues.
- Use ISO dates (`YYYY-MM-DD`) once the file is initialized.
- Never record secrets, tokens, private URLs, `.env` values, or personal data.
- Never claim a hosted URL, passing test, deployed revision, or completed feature without evidence.
- If the handoff conflicts with verified code, update the handoff.
- If code conflicts with a source specification, report the conflict before changing behavior.
- Keep `SUBMISSION READY` out of this file until Phase 16 has passed every required check.
