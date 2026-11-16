# AI Whiteboard Tutor

A full-stack starter for the Braynix Studios AI Whiteboard Tutor assignment.

## Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS, Axios, Lucide
- Backend: FastAPI, Python, Pydantic
- Stage 1 currently includes a working landing page, backend health endpoint, and frontend/backend connectivity check.
- AI lesson generation, audio narration, synchronized whiteboard, follow-up chat, and persistence are planned for subsequent stages.

## Prerequisites
- Node.js 22 LTS (or compatible current LTS)
- Python 3.11+
- Git

## Run on Windows 10

### Backend
Open PowerShell in `backend`:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If PowerShell blocks activation:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

Backend URLs:
- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/api/health

### Frontend
Open a second PowerShell in `frontend`:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment
Backend `.env`:
- `APP_NAME`
- `FRONTEND_URL`
- `OPENAI_API_KEY` (not needed for Stage 1)

Frontend `.env.local`:
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

Never commit `.env`, `.env.local`, API keys, generated audio, or virtual environments.

## Project status
Stage 1 foundation only. Do not represent AI generation or voice synchronization as implemented until those stages are completed and tested.
