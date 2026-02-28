# CoverCraft BD

Academic cover page generator for Bangladeshi universities.

This project is a pnpm monorepo with:
- `apps/web`: React + Vite frontend for designing covers
- `apps/server`: Express + Prisma backend with authentication, profile, templates, and cover history

## Features

- Authentication with email/password and Google login
- University-aware student profile setup
- 13 cover templates (assignment/lab report)
- 8 color palettes
- PNG export from the designer (via `html2canvas`)
- PDF export from the designer
- Cover history with save/list/delete
- Admin endpoints for stats/users/covers/university sync

## Tech Stack

- Frontend: React 19, Vite 8 beta, React Router, Zustand, Axios
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Package manager: pnpm workspace

## Monorepo Structure

```text
covercraft-bd/
├─ apps/
│  ├─ web/                 # Frontend
│  └─ server/              # Backend API
├─ docs/
├─ package.json            # Workspace scripts
├─ pnpm-workspace.yaml
└─ start.ps1               # Windows helper to run web + server
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database

## Environment Variables

### `apps/server/.env`

```dotenv
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

### `apps/web/.env`

```dotenv
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

If Google login is not configured, keep `VITE_GOOGLE_CLIENT_ID=placeholder` and use email/password auth.

## Installation

From repository root:

```bash
pnpm install
```

## Run in Development

### Option 1: Run both apps from root

```bash
pnpm dev
```

### Option 2: Run apps separately

```bash
pnpm dev:server
pnpm dev:web
```

### Option 3 (Windows): Use helper script

```powershell
.\start.ps1
```

This script kills any existing process on port `5000` and launches server + web in separate PowerShell windows.

## Build and Typecheck

From root:

```bash
pnpm build
pnpm typecheck
```

## Database Setup

Use Prisma commands from `apps/server` as needed:

```bash
pnpm --filter server prisma migrate dev
pnpm seed
```

## API Overview

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google`
- `GET /auth/me` (auth required)

### Universities
- `GET /universities`
- `GET /universities/:id`

### Templates
- `GET /templates`

### Profile (auth required)
- `GET /profile`
- `PUT /profile`

### Covers (auth required)
- `GET /covers`
- `POST /covers`
- `POST /covers/generate`
- `GET /covers/:id/download`
- `DELETE /covers/:id`

### Admin (auth + admin role required)
- `GET /admin/stats`
- `GET /admin/users`
- `GET /admin/covers`
- `PUT /admin/universities/:id`
- `POST /admin/universities/sync`

## Core Data Models (Prisma)

- `User` (role: `STUDENT` or `ADMIN`)
- `Profile` (student academic info linked to user + university)
- `University`
- `Cover` (template id + JSON payload + generated file links)

## Templates and Palette Catalog

- Templates: 13 (`id: 1` to `13`)
- Color palettes: 8 (`blue`, `green`, `maroon`, `purple`, `teal`, `navy`, `brown`, `slate`)

Template metadata is defined on the backend in `apps/server/src/constants/template-catalog.ts` and consumed by the frontend designer.

## Troubleshooting

- `localhost` not opening:
  - Check both apps are running (`5000` for server, `5173` for web)
  - Verify `VITE_API_URL` points to `http://localhost:5000/api`
- PNG export stuck:
  - Ensure frontend dependencies are installed (`html2canvas` is required)
  - Try refreshing and exporting again
- Port conflict on `5000`:
  - Use `.\start.ps1` or manually stop the conflicting process

## Useful Scripts (Root)

- `pnpm dev` - run web + server in parallel
- `pnpm dev:web` - run only frontend
- `pnpm dev:server` - run only backend
- `pnpm build` - build web and server
- `pnpm seed` - seed server database
- `pnpm typecheck` - run TypeScript checks for web + server

## License

ISC
