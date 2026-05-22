# Project Management

Compact project management web app for a small team.

## Stack

- Frontend: Next.js + TypeScript
- Backend: FastAPI + SQLite

## Run Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Shared configuration lives in the repo root `.env`. Set `PM_DEVELOPMENT_MODE=true` to proxy to `PM_BACKEND_URL_DEV`, or `false` to proxy to `PM_BACKEND_URL_PROD`.

## Quick Commands

From the repo root you can use these helper scripts instead of changing directories manually.

Windows CMD / PowerShell:

```bat
start-dev.bat
```

Git Bash / Bash:

```bash
./start.sh
./stop.sh
```

`start.sh` starts both production servers in the background. The backend runs on `0.0.0.0:8000` by default and the frontend runs on `0.0.0.0:3000` by default. You can override them with `PM_BACKEND_HOST`, `PM_BACKEND_PORT`, `PM_FRONTEND_HOST`, and `PM_FRONTEND_PORT`.

`start.sh` creates `backend/.venv` automatically when it is missing, installs `backend/requirements.txt`, runs `npm install`, and rebuilds the frontend before starting the services.

`start.sh` writes logs to `backend/runtime/backend.log` and `backend/runtime/frontend.log`, and stores PID files in the same directory.

`stop.sh` stops both background processes started by `start.sh`.
