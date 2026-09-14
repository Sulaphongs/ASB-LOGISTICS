# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ASB Logistics — an admin/staff panel (Lao-language UI) for a shipping/freight-forwarding business (orders from China → warehouse → customer in Laos). Customers, packages/orders with a tracking-code + status timeline, weight/volume-based shipping-fee calculation, warehouse receiving, users, settings, reports, and an activity audit log.

**Two implementations live in this repo — only one is active:**
- **Active stack**: `server/` (Node/Express API) + `client/` (React/Vite SPA). All current development happens here.
- **Legacy/reference only**: the root-level `*.php` files, `api/`, `classes/`, `config/`, `includes/`, `partials/`, `assets/` — the original PHP+MySQL version this was rewritten from. It is **not used by the active stack** and is kept only for reference. Do not extend it; treat it as read-only history unless the user explicitly asks to work on the PHP version.

## Commands

There is no test suite and no lint config in this repo — don't invent `npm test`/lint commands.

**Server** (`server/`, ESM, ports 4000):
```
cd server
npm install
copy .env.example .env        # then set DB_USER/DB_PASS/JWT_SECRET
npm run seed                  # creates/resets admin user (default admin/admin123); npm run seed <user> <pass> to customize
npm run dev                   # node --watch src/index.js
npm start                     # plain node src/index.js (production)
```

**Client** (`client/`, port 5173, Vite dev-proxies `/api/*` → `http://localhost:4000`):
```
cd client
npm install
npm run dev
npm run build                 # outputs client/dist — server/src/index.js serves this automatically if present, for single-port production
npm run preview
```

**Database**: MySQL/MariaDB. Import `server/database/schema.sql` (the active schema — not the root-level `database/schema.sql`, which belongs to the legacy PHP version). If a database from before the photo-upload feature already exists, re-run the migration at the bottom of that file (`ALTER TABLE packages ADD COLUMN IF NOT EXISTS photo_path ...`).

**Local dev note**: this project historically ran under XAMPP, but the active stack only needs XAMPP's **MySQL** service — Apache/PHP is irrelevant to it now.

## Architecture (active stack)

### Server (`server/src/`)
- `index.js` — Express app entrypoint. Mounts each resource router under `/api/<resource>`, serves uploaded files from `/uploads`, and (production) serves the built `client/dist` as a SPA with an `app.get('*')` fallback so one process serves both API and UI.
- `db.js` — a single shared `mysql2/promise` `pool` export. No ORM/query builder; every route writes raw SQL against `pool`.
- `middleware/auth.js` — JWT-in-httpOnly-cookie auth (cookie name `asb_token`). `requireAuth` / `requireAdmin` are applied per-router (most `*.routes.js` files call `router.use(requireAuth)` right after creating the router). Stateless — no server-side session table, no forced logout.
- `routes/*.routes.js` — one router per resource (customers, packages, pricing, users, settings, dashboard, activity, public/auth). Convention followed throughout: inline validation, raw SQL, respond with `{ success: boolean, ... }`, and call `logActivity(pool, {...})` from `utils/activityLogger.js` after every create/update/delete to populate `activity_logs`. `public.routes.js` and `auth.routes.js` are the only unauthenticated routes (customer package tracking, login).
- `utils/helpers.js` — tracking-code generator (`ASB-YYMMDD-XXXX`, collision-checked against the DB), customer-code generator (`ASB0001`, `ASB0002`, ...), and the canonical package-status labels/flow.
- `scripts/seedAdmin.js` — the only way to create/reset the admin user (bcryptjs hash), run via `npm run seed`.

### Client (`client/src/`)
- `main.jsx` — mounts `ThemeProvider > AuthProvider > BrowserRouter > App`. Also runs a small inline script *before* React renders to set the `dark` class on `<html>` from `localStorage`/`prefers-color-scheme`, avoiding a flash of the wrong theme.
- `App.jsx` — all routes. Public: `/login`, `/track` (customer-facing tracking, no auth), `/packages/:id/label` (print-only shipping label — see below). Everything else is wrapped in `<ProtectedRoute>` (pass `adminOnly` for admin-gated pages); each page component renders its own `<Layout>` (sidebar + header) — `Layout` is not a route-level wrapper.
- `api/client.js` — the single place `fetch` is called. `api.get/post/put/del/upload(path, ...)` all hit `` `/api${path}` `` with `credentials: 'include'` so the JWT cookie rides along automatically; the Vite dev proxy forwards `/api/*` to the server so there's no CORS to deal with in dev.
- `context/AuthContext.jsx`, `context/ThemeContext.jsx` — global state via plain React Context + hooks (`useAuth`, `useTheme`), no external state library.
- `index.css` — Tailwind directives plus hand-written shared classes (`.card`, `.btn`/`.btn-primary`/`.btn-light`/`.btn-danger`, `.field`, `table.data-table`, `.badge` + one `.badge-<status>` per status/payment/active state, `.modal-backdrop`/`.modal-box`). Pages compose these instead of repeating Tailwind utilities, and this file is the single place both dark-mode (`dark:`) variants and status-badge colors are centralized — when adding a new status or tweaking global chrome, edit here first rather than per-page.
- Dark mode: `tailwind.config.js` uses `darkMode: 'class'`; toggled via the switch in `Sidebar.jsx`, persisted to `localStorage`. `Track.jsx` (public tracking page) and `PackageDetail`'s print label route are deliberately kept light-only/theme-independent — the label must match the physical printout.

### Data model / business flow
`customers` → `packages` (each package auto-gets a tracking code and moves through a fixed `STATUS_FLOW`: `ordered → arrived_cn_warehouse → shipped → arrived_la_warehouse → out_for_delivery → delivered`, or `cancelled` at any point) → `package_status_history` (the timeline, one row per status change) → `pricing_rules` (per-kg or per-cbm rate rules, land/air, used to auto-calculate `shipping_fee`) → `activity_logs` (every create/update/delete/status-change/login across the app, written via `logActivity`).
