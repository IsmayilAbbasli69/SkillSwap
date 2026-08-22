# SkillSwap Backend MVP

Backend-only MVP implementation of the SkillSwap PRD/TDD.

## Stack

- Node.js
- Express
- Supabase Auth
- In-memory repository layer seeded from JSON
- Swagger UI for endpoint testing

## Run

```bash
npm install
npm run dev
```

Server:

- `http://localhost:4000`
- Docs: `http://localhost:4000/docs`
- Health: `http://localhost:4000/health`

## Authentication

Set these environment variables before running:

- `AUTH_MODE=supabase`
- `SUPABASE_URL=<your-project-url>`
- `SUPABASE_ANON_KEY=<your-anon-key>`

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
- Data is reset on server restart because repositories are in-memory.
- Architecture follows routes -> controllers -> services -> repositories.
- Existing seeded users are local mock data, not Supabase accounts.
