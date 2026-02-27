# CoverCraft BD Execution Plan

## Vision
Build an English-only web platform for Bangladeshi university students to generate print-ready A4 assignment and lab report covers with dynamic university branding, reusable profile data, and export support (PNG/PDF).

## Current Baseline (Implemented)
- Auth + profile + universities + cover history APIs exist.
- University seed data includes public and private universities.
- Cover designer has 10 templates and palette support.
- Cover export buttons now trigger save + client export flow.
- Admin API foundations are now in place.

## MVP Scope (Phase 1)
1. User onboarding
- Email/password sign-up + Google sign-in.
- Profile setup with reusable fields (student ID, department, university, etc.).

2. Cover generation
- 10 templates.
- Theme palette selection.
- University logo auto-fill from profile.
- Export to PNG (client-side) and PDF (print dialog).

3. Admin
- User, cover, and stats monitoring.
- University update and sync endpoints.

## API Contracts (Core)
- `GET /api/templates`
- `GET /api/universities`
- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/covers/generate`
- `GET /api/covers`
- `GET /api/covers/:id/download`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/covers`
- `PUT /api/admin/universities/:id`
- `POST /api/admin/universities/sync`

## Next Sprints
1. Server-side export hardening
- Replace client PDF/PNG fallback with Puppeteer service.
- Upload generated files to object storage (R2/S3 compatible).
- Return signed download URLs.

2. Admin frontend
- Role-based admin dashboard for stats, users, covers, university sync logs.

3. Quality + reliability
- Validation with `zod`/`valibot`.
- Rate limiting + audit logs.
- Unit/integration tests for auth/profile/cover/admin APIs.

4. Deployment
- Frontend on Vercel.
- Backend + PostgreSQL on Railway or Render.
- CI/CD through GitHub Actions.

## Operations Checklist
- Keep `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `API_PUBLIC_URL` in env.
- Rotate admin default password before production.
- Verify logo URLs are CORS-accessible for browser PNG export.
