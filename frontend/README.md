# Frontend

Next.js renderer plus Electron shell for the desktop Project Management app.

## Local Development

Install dependencies and start the desktop app against the local backend:

```bash
npm install
npm run dev:desktop
```

The renderer runs on `http://localhost:3000`. Electron injects `X-Project-Client-Key` into backend `/api/*` requests from the main process.

## Environment

Use `.env` for local development. For packaged desktop builds, create `.env.production` with the values you want bundled into the app:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
PM_APP_CLIENT_KEY=replace-with-same-backend-key
PM_UPDATE_URL=http://127.0.0.1:8000/updates/win
```

`PM_UPDATE_URL` is optional if the update feed is hosted on the same backend as `NEXT_PUBLIC_API_URL`; the Electron shell falls back to `${NEXT_PUBLIC_API_URL}/updates/win`.

## Windows Packaging

Build the exported renderer and generate an NSIS installer:

```bash
npm run dist:win
```

Artifacts are written to `frontend/dist/`. For the updater, copy these files into `backend/updates/win/` on the server:

- `latest.yml`
- `Project Management-Setup-<version>.exe`
- `Project Management-Setup-<version>.exe.blockmap`

Packaged apps check the update feed on launch and prompt the user to restart once a new version has been downloaded.
