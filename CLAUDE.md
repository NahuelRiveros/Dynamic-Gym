# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dynamic Gym** is a full-stack gym management system with two main parts:
- `frontend/` — React 19 + Vite SPA
- `servidor/` — Node.js Express 5 REST API

In production, the Express server serves the built frontend as static files from `frontend/dist`.

## Commands

### Frontend (`frontend/`)
```
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Build to frontend/dist
npm run preview   # Preview production build
npm run lint      # ESLint
```

### Backend (`servidor/`)
```
npm run dev       # Start with nodemon (hot-reload)
npm start         # Production start
```

There are no automated tests. Run both servers simultaneously for local development.

## Architecture

### Backend (`servidor/src/`)
- **Entry**: `server.js` → connects DB, starts cron, calls `createApp()`, listens on port 3001
- **App factory**: `app.js` — registers middleware (helmet, morgan, cors, cookie-parser) and mounts `/api` routes; also serves `frontend/dist` for SPA fallback
- **Routes**: `routes/index.js` aggregates all routers under `/api/`
- **Pattern**: each feature has `routes/ → controllers/ → services/` — services contain business logic and raw SQL or Sequelize calls
- **Database**: `database/sequelize.js` — connects to PostgreSQL; uses `DATABASE_URL` if set (Render/prod) or individual `DB_*` env vars for local
- **Models**: defined in `models/`, associations wired in `models/index.js` (imported once at startup)
- **Auth**: JWT Bearer tokens; `middleware/auth_middleware.js` exports `requireAuth` and `requireRole(...roles)`
- **Cron**: `cron/estado_alumno_cron.js` runs every hour to auto-update student statuses (active/expired)
- **Timezone**: all date logic uses `America/Argentina/Buenos_Aires` / `America/Argentina/Cordoba`

### Frontend (`frontend/src/`)
- **Entry**: `main.jsx` wraps the app in `QueryClientProvider` → `AuthProvider` → `RouterProvider`
- **Router**: `app/router.jsx` — all routes; protected routes use `<ProtectedRoute roles={[...]}>`
- **Auth**: `auth/auth_context.jsx` — `AuthProvider` + `useAuth()` hook; stores JWT in `localStorage` under key `"token"`; sends as `Authorization: Bearer` header via Axios interceptor in `api/http.js`
- **API layer**: `api/` — one file per domain (`auth_api.js`, `pagos_api.js`, `kiosk_api.js`, etc.); all use the shared `http` axios instance with `baseURL = VITE_API_URL` (default `http://localhost:3001/api`)
- **Server state**: `@tanstack/react-query` for data fetching; `app/query_client.js` has the client instance
- **Forms**: `react-hook-form` + `@hookform/resolvers` + `zod` for validation
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no separate PostCSS config needed)
- **UI icons**: `lucide-react`

### Data Model (key tables)
```
GymPersona (1) ──── (1) GymAlumno ──── (N) GymFechaDisponible (gym_plan_alumno)
                                              └── (N) GymDiaIngreso
GymCatTipoPlan (1) ─────────────────── (N) GymFechaDisponible
GymPersona (1) ──── (1) GymUsuario ─── (N:N via GymUsuarioRol) GymRol
```
- `gym_alumno_rela_estadoalumno = 1` means the student is enabled/active
- Plans are stored per payment in `gym_plan_alumno`; a new plan always starts today (not after the current plan expires)

### Roles
- `admin` — full access
- `staff` — limited access (payment registration, student list/detail)
- Public routes: `/`, `/kiosk`, `/login`, `/register`

## Environment Variables

Create `servidor/.env` for local development:
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dynamicgym
DB_USER=postgres
DB_PASS=your_password
JWT_SECRET=your_secret
DB_SSL=false
# For production (Render):
# DATABASE_URL=postgres://...
# DB_SSL=true
```

Frontend reads `VITE_API_URL` from `frontend/.env` (defaults to `http://localhost:3001/api`).

## API Routes

All prefixed with `/api/`:
- `GET /health` — DB health check (no auth)
- `/auth` — login, logout, me, register
- `/alumnos` — student list
- `/personas` — person CRUD + student registration
- `/ingresos` — kiosk check-in by DNI
- `/pagos` — payment registration
- `/estadisticas` — revenue and attendance stats
- `/recaudacion` — daily/monthly revenue calendars
- `/catalogos` — lookup tables (plans, document types, etc.)
- `/planes` — plan management
- `/staff` — staff management
- `/admin/usuarios` — user/role management
- `/admin/alumnos` — edit active student plans
