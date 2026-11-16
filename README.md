# AI Whiteboard Tutor

Full-stack AI learning app: Next.js frontend + FastAPI backend. Enter a topic, generate a structured OpenAI lesson, and review narration/visual actions in a workspace.

## Architecture

Vercel **multi-service** deployment (same public domain):

| Service | Root | Framework | Public path |
|---------|------|-----------|-------------|
| `frontend` | `frontend/` | Next.js | `/` |
| `backend` | `backend/` | FastAPI | `/api/*` |

Root `vercel.json` rewrites:

1. `/api/*` → `backend` service  
2. `/*` → `frontend` service  

Browser API calls use **same-origin** `/api/...` (no separate backend hostname required in production).

```text
Browser  -->  https://<project>.vercel.app/
                 |-- /              --> Next.js frontend
                 `-- /api/*         --> FastAPI backend
```

## Technologies

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Axios, Lucide
- **Backend:** FastAPI, Pydantic, OpenAI Python SDK, Pytest
- **AI:** OpenAI Chat Completions (structured JSON lessons)

## Local development

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env and set OPENAI_API_KEY for real lesson generation
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API docs: http://127.0.0.1:8000/docs  
- Health: http://127.0.0.1:8000/api/health  

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev -- --port 3001
```

Open http://localhost:3001.

With default `NEXT_PUBLIC_API_URL=/api`, Next.js rewrites `/api/*` to `http://127.0.0.1:8000/api/*` during local `next dev` (disabled on Vercel).

## Environment variables

### Frontend (`frontend/.env.local` or Vercel → frontend service)

| Variable | Example | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | `/api` | Production default. Same-origin API. |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api` | Optional local direct FastAPI |
| `BACKEND_PROXY_URL` | `http://127.0.0.1:8000` | Optional local rewrite target |

### Backend (`backend/.env` or Vercel → backend service)

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Yes (for generation) | **Secret. Never use `NEXT_PUBLIC_`.** |
| `OPENAI_MODEL` | No | Default `gpt-4.1-mini` |
| `APP_NAME` | No | Display name |
| `FRONTEND_URL` | No | Extra CORS origin |
| `CORS_ORIGINS` | No | Comma-separated local origins |

**Security**

- Never commit `.env` / `.env.local`
- Never expose `OPENAI_API_KEY` to the browser
- Only placeholder values belong in `.env.example`

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health + `openai_configured` |
| `POST` | `/api/lessons/generate` | Generate lesson (`topic`, `level`, `duration`) |
| `GET` | `/api/lessons/{lesson_id}` | Fetch stored lesson |
| `GET` | `/` | Backend root (service only) |

There is no `/api/chat` endpoint in this codebase.

## Vercel multi-service deployment

1. Import `https://github.com/Kishore270400/ai-whiteboard-tutor` into Vercel.
2. Ensure the project uses the **root** `vercel.json` (do not set Root Directory to `frontend` only).
3. Confirm services:
   - `backend` → `backend` / FastAPI  
   - `frontend` → `frontend` / Next.js  
4. Environment variables:
   - **Backend service:** `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4.1-mini`
   - **Frontend service:** `NEXT_PUBLIC_API_URL=/api` (optional if unset; code defaults to `/api`)
5. Deploy.
6. Verify:
   - `https://<your-deployment>/api/health`
   - `https://<your-deployment>/` landing page
   - Generate Lesson → workspace page

**Note:** Multi-service `vercel.json` (`services` + rewrite destinations) requires Vercel support for that configuration. If the dashboard rejects it, keep the same architecture intent and consult current Vercel multi-service docs—do not silently switch to a different topology without updating this README.

## Build and test commands

```powershell
# Frontend
cd frontend
npm install
npm run build
node scripts/verify-api-url.mjs

# Backend
cd backend
.\venv\Scripts\Activate.ps1
python -m pytest tests -q
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Vercel build ESLint `/` links | Use `next/link` for in-app routes (already fixed) |
| `/api/api/...` 404 | Base URL must be `/api` and paths `/health`, `/lessons/...` (not `/api/health` again) |
| Backend disconnected locally | Start uvicorn on 8000; keep `NEXT_PUBLIC_API_URL=/api` or set direct `http://127.0.0.1:8000/api` |
| Lesson generate 503 | Set `OPENAI_API_KEY` on the **backend** service and redeploy |
| CORS errors in local | Allowed origins include localhost:3000/3001; restart backend after `.env` changes |
| Wrong monorepo root warning | `frontend/next.config.ts` sets `outputFileTracingRoot` |

## License / assignment

Built for the Braynix Studios AI Whiteboard Tutor assignment.
