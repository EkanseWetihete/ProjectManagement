# Frontend

Next.js web frontend for Project Management.

## Local Development

Install dependencies and start the web app against the local backend:

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default.

## Environment

Use the repo root `.env` for local development and deployment:

```bash
PM_DEVELOPMENT_MODE=true
PM_BACKEND_URL_DEV=http://127.0.0.1:8000
PM_BACKEND_URL_PROD=http://198.46.175.134:8000
PM_APP_CLIENT_KEY=replace-with-long-random-string
```

The frontend proxies browser `/api/*` requests through the Next.js server and injects `X-Project-Client-Key` there, so the key does not ship to the browser.

## Production

Build and run the Next.js server:

```bash
npm run build
npm run start
```
