# Backend

FastAPI API for the desktop project manager.

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API defaults to `http://127.0.0.1:8000` and seeds a demo project into `data/project_manager.db` on first start.

## Desktop Updates

The backend serves Electron update artifacts from `/updates`.

For Windows releases, copy these files into `backend/updates/win/`:

- `latest.yml`
- the generated installer `.exe`
- the matching `.blockmap`

Once those files are present, packaged desktop clients can check `http://your-backend/updates/win` for updates.
