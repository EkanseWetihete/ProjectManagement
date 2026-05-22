# Backend

FastAPI API for the Project Management web app.

Configuration is loaded from the repo root `.env`.

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API defaults to `http://127.0.0.1:8000` and seeds a demo project into `data/project_manager.db` on first start.
