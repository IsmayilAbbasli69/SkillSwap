# SkillSwap Backend MVP

Backend-only MVP implementation of the SkillSwap PRD/TDD.

## Stack

- Node.js
- Express
- Backend JWT authentication with a persisted development data store or Supabase database
- Repository layer backed by the selected development/production data provider
- Swagger UI for endpoint testing

## Run

```bash
npm install
npm run seed:dev
npm run dev
```

Server:

- `http://localhost:4000`
- Docs: `http://localhost:4000/docs`

## Netlify deployment

Set the Netlify base directory to `backend`. The included `netlify.toml` exposes
the Express app through `/api/*` and forwards `/health` to the function.

Configure these Netlify environment variables before deploying:

- `NODE_ENV=production`
- `AUTH_MODE=database`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` when profile bootstrap or admin operations need it

The frontend `VITE_API_BASE_URL` must point to the deployed backend URL ending
in `/api`, for example `https://your-backend.netlify.app/api`.
- Health: `http://localhost:4000/health`

## Authentication

Copy `.env.example` to `.env`. For local development use:

- `AUTH_MODE=local`
- `JWT_SECRET=<a long random development secret>`

Local mode uses local password hashes, local JWT issuance/verification, and the
same profile IDs throughout. `npm run seed:dev` safely resets development data
and creates these development-only accounts (password `Password123!`):

- `student@skillswap.test` (`STUDENT`)
- `maya@skillswap.test` (`STUDENT`)
- `admin@skillswap.test` (`ADMIN`)

For database-backed authentication set `AUTH_MODE=database`, `SUPABASE_URL`,
and a Supabase key. Password hashes are stored in `public.users`; Supabase Auth
email delivery is not used. React always talks to Express; it never receives a
Supabase key.

### Signup

`POST /api/auth/signup`

```json
{
	"email": "student1@example.com",
	"password": "strongpass123",
	"firstName": "Sara",
	"lastName": "Lee",
	"institutionId": "11111111-1111-4111-8111-111111111111",
	"unitId": "aaaa1111-1111-4111-8111-111111111111"
}
```

### Login

`POST /api/auth/login`

```json
{
	"email": "student1@example.com",
	"password": "strongpass123"
}
```

Use the returned access token for protected endpoints:

- `Authorization: Bearer <accessToken>`

## Implemented Endpoint Groups

- Profile (`/api/profile/me`)
- Skills (`/api/skills`, `/api/profile/me/skills`)
- Search (`/api/search`)
- Requests (`/api/requests`)
- Sessions (`/api/sessions`, `/api/requests/:requestId/session`)
- Reviews (`/api/sessions/:sessionId/review`)
- Admin (`/api/admin/*`)

## Notes

- Tenant scope is always derived from authenticated profile.
- Local data is shared by clients and persisted in `backend/.data/local-db.json`.
- Reset it explicitly with `npm run seed:dev`; `.data` is git-ignored.
- Architecture follows routes -> controllers -> services -> repositories.
