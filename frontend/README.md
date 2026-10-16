# Frontend (React + Vite)

This is the OHAS frontend app.

## Scripts

From `/frontend`:

- `npm run dev` — start Vite dev server on port `5173`
- `npm run build` — run TypeScript project build (`tsc -b`) and Vite production build
- `npm run typecheck` — run TypeScript project checks (`tsc -b`)
- `npm run lint` — run ESLint
- `npm run preview` — preview built assets

## API base URL behavior

API calls use:

- `VITE_API_BASE_URL` if set
- otherwise default to `/api/v1` (`src/api/auth.ts`)

In development, `vite.config.ts` proxies `/api` to `http://localhost:8000`.

## Dev server behavior

`vite.config.ts` is configured to:

- bind to LAN (`host: true`)
- stay on `5173` (`strictPort: true`)
- proxy backend API calls through `/api`
