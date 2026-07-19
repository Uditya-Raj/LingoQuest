# LingoQuest — Duolingo Clone

LingoQuest is a full-stack Duolingo-style language learning web app built for the SDE Fullstack Assignment. It recreates the core Duolingo learning experience: a gamified learning path, interactive lessons, hearts, XP, streaks, achievements, profile, leaderboard, audio/TTS support, timed practice, and a playful 3D UI.

## Live Links

- Live App: https://lingo-uest.netlify.app/
- Backend API Docs: https://lingoquest-backend-hap2.onrender.com/api/docs
- Backend Base URL: https://lingoquest-backend-hap2.onrender.com/api
- GitHub Repository: https://github.com/Uditya-Raj/LingoQuest

## Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- Motion / Framer Motion
- Browser Speech Synthesis API for TTS

### Backend

- FastAPI
- SQLAlchemy 2.0 async
- Alembic migrations
- SQLite
- Pydantic v2
- Pytest

## Core Features

- Duolingo-style learning path with units, skills, locked/available/in-progress/completed states
- Skill progress rings and crown-style progression
- Lesson player with five exercise types:
  - Multiple choice
  - Translate using word bank
  - Match pairs
  - Fill in the blank
  - Type the answer
- Immediate correct/incorrect feedback bar
- Hearts system with loss, refill, and regeneration
- XP awarding with perfect lesson bonus
- Streak tracking with testable day logic
- Daily XP goal indicator
- Learner profile with stats and achievements
- Seeded leaderboard
- Content stored in database and seeded automatically
- Admin content manager for exercises
- Audio/TTS support using browser speech synthesis
- Timed practice mode
- Responsive UI for mobile, tablet, and desktop
- Light/dark mode
- Original mascot-style visual design using LingoQuest branding

## Project Structure

```txt
.
├── backend
│   ├── app
│   │   ├── models
│   │   ├── routers
│   │   ├── schemas
│   │   ├── services
│   │   ├── seed
│   │   └── main.py
│   ├── alembic
│   ├── tests
│   └── requirements.txt
├── frontend
│   ├── app
│   ├── components
│   ├── hooks
│   ├── lib
│   ├── stores
│   └── package.json
└── docs
```

## Architecture Overview

The app is split into a Next.js frontend and a FastAPI backend.

The backend is the source of truth for all learner state including hearts, XP, streaks, crowns, achievements, and skill progression. The frontend never calculates these values permanently. It renders values returned from backend API responses.

Backend routers are intentionally thin. Business logic lives inside `backend/app/services/`, including:

- Lesson attempt state
- Answer grading
- Hearts logic
- XP calculation
- Streak updates
- Skill progress and crowns
- Achievement checks
- Timed practice rules

This keeps the API layer clean and makes the core gamification logic testable.

## Database Schema Overview

The database uses a normalized relational schema.

Main tables:

- `users` — learner profile, XP, streak, hearts, gems, daily goal
- `courses` — language course metadata
- `units` — course sections
- `skills` — learning path nodes
- `lessons` — lesson pools for each skill
- `exercises` — exercise content and answer contracts
- `lesson_attempts` — each learner lesson/timed attempt
- `exercise_answers` — submitted answer history
- `user_skill_progress` — crowns, status, and practice count per skill
- `achievements` — achievement definitions
- `user_achievements` — earned achievements per user

Important design choice:

`lesson_attempts` is separate from `lessons`, so skills are replayable and crown progression can work without duplicating lesson content.

## API Overview

Base URL:

```txt
/api
```

Main endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/course` | Get full learning path with derived skill states |
| GET | `/api/skills/{skill_id}` | Get skill detail |
| POST | `/api/skills/{skill_id}/start` | Start/resume standard lesson |
| POST | `/api/skills/{skill_id}/start-timed` | Start timed practice |
| GET | `/api/lessons/{attempt_id}` | Retrieve active lesson attempt |
| POST | `/api/lessons/{attempt_id}/answer` | Submit answer and receive feedback |
| POST | `/api/lessons/{attempt_id}/complete` | Complete lesson and apply gamification |
| GET | `/api/hearts/status` | Get hearts and regeneration state |
| POST | `/api/hearts/refill` | Refill hearts |
| GET | `/api/user/me` | Get learner profile |
| PATCH | `/api/user/me` | Update profile/settings |
| GET | `/api/leaderboard` | Get seeded leaderboard |
| GET | `/api/achievements` | Get achievement list |
| GET | `/api/admin/content/tree` | Admin content tree |
| POST | `/api/admin/exercises` | Create exercise |
| PATCH | `/api/admin/exercises/{id}` | Edit exercise |

Interactive API docs are available at:

```txt
/api/docs
```

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
```

On Windows:

```bash
.\.venv\Scripts\activate
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
alembic upgrade head
```

Seed database:

```bash
python -m app.seed.seed_data
```

Start backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will run at:

```txt
http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

Start frontend:

```bash
npm run dev
```

Frontend will run at:

```txt
http://localhost:3000
```

## Deployment

The deployed app uses:

- Frontend: Netlify
- Backend: Render
- Database: SQLite, migrated and seeded on backend startup

Render start command:

```bash
alembic upgrade head && python -m app.seed.seed_data && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The seed script is idempotent, so it is safe to run on deployment without duplicating data.

## Assumptions and Deviations

- Real authentication is simplified to one seeded logged-in learner.
- One seeded Spanish course is used.
- Gems and refill economy are mocked.
- Speech recognition/pronunciation is a placeholder, but audio playback/TTS is implemented.
- Heart regeneration interval is shortened for demo friendliness.
- Leaderboard uses seeded users.
- All visual assets and mascot-style illustrations are original and do not use Duolingo brand assets.

## Testing

Backend tests:

```bash
cd backend
python -m pytest tests/ -q
```

Frontend checks:

```bash
cd frontend
npm run test
npm run typecheck
npm run lint
npm run build
```

## Submission Notes

LingoQuest was built to prioritize the required assignment workflows:

- Functional lesson loop
- Persistent gamification
- Strong database design
- Seeded demo-ready content
- Duolingo-like UX
- Responsive and polished frontend