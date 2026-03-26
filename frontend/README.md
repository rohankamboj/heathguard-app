# HealthGuard — Frontend

React 18 + TypeScript + Vite SPA for the HealthGuard dashboards (admin, manager, user). It talks to the backend through a dev proxy so browser requests stay on `/api` and avoid CORS friction during local development.

For full-stack setup, demo logins, and architecture, see the [root README](../README.md).

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) (this repo pins `packageManager` in `package.json`; use `corepack enable` if you want pnpm invoked automatically)

## Setup

```bash
cd frontend
pnpm install
```

## Run

Start the [backend](../backend/README.md) on port **8000**, then:

```bash
pnpm dev
```

Open **http://localhost:5173** (or the host you set with `VITE_DEV_HOST`).

The Vite dev server proxies `/api` to the backend (`vite.config.ts`). By default the proxy target is `http://localhost:8000`. To point at another API URL:

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:8000 pnpm dev
```

`VITE_DEV_HOST` controls the dev server bind address (default `localhost`).

## Other scripts

| Command | Purpose |
|---------|---------|
| `pnpm build` | Typecheck and production build to `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript project build (no emit) |

## API client

`src/services/api.ts` uses Axios with `baseURL: '/api'`. In development, those requests are proxied to the FastAPI app. In production behind a reverse gateway, `/api` should be routed to the same host’s API (or adjust build-time configuration to match your deployment).

## Stack (high level)

- **Routing:** React Router
- **Server state:** TanStack Query
- **Client state:** Zustand
- **UI:** Tailwind CSS 4, Radix-oriented components, Lucide icons

## Docker

A `Dockerfile` lives in this folder for image builds; compose and multi-service workflows are documented at the repository root.
