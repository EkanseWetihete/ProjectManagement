# Project Management

Compact project management desktop app for a small team.

## Stack

- Frontend: Next.js + Electron + TypeScript
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
npm run dev:desktop
```

The frontend expects the backend at `http://127.0.0.1:8000` unless `NEXT_PUBLIC_API_URL` is overridden.

## Quick Commands

From the repo root you can use these helper scripts instead of changing directories manually.

Windows CMD / PowerShell:

```bat
start-backend.bat
update-and-start-backend.bat
start-dev.bat
build-installer.bat
```

Git Bash / Bash:

```bash
./start-backend.sh
./start-backend-background.sh
./stop-backend-background.sh
./update-and-start-backend.sh
./update-and-start-backend-background.sh
./start-dev.sh
./build-installer.sh
```

`start-backend` runs only the FastAPI server.

`start-backend-background` runs the backend as a background process on `0.0.0.0:8000` by default, writes logs to `backend/runtime/backend.log`, and trims the log back to the latest 1000 lines once it grows past 10000 lines. You can override the bind address with `PM_BACKEND_HOST` and `PM_BACKEND_PORT`.

`stop-backend-background` stops the background backend process started by the background start script.

`update-and-start-backend` fetches and fast-forward pulls the current branch from `origin`, then starts the backend. It only works when the project root itself is a git checkout and the working tree is clean.

`update-and-start-backend-background` does the same git check and pull, then starts the background backend process.

`build-installer` generates the Windows installer in `frontend/dist/` and copies `latest.yml`, the installer `.exe`, and the `.blockmap` into `backend/updates/win/`.
