# SkillSwap Frontend Development Guide

This guide explains how to run the SkillSwap frontend against either its temporary development mock API or the real Express API, how to verify the application, and what work remains.

## Prerequisites

- Node.js and npm
- The frontend dependencies installed with `npm install`
- For real API mode, the SkillSwap Express backend running locally on port 4000

The supported frontend architecture is always:

```text
React component -> typed API module -> centralized Axios client -> HTTP API
```

React must never connect directly to Supabase or PostgreSQL. Mock mode intercepts the same HTTP requests in the browser; components and API modules do not change between modes.

## Environment configuration

Vite reads frontend environment values from `.env`. Start by copying `.env.example` to `.env` if a local file does not exist.

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_MOCK_API=true
```

Restart the Vite development server whenever an environment value changes.

### Mode 1: Temporary mock API

Use this mode while the real backend environment is unavailable:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_MOCK_API=true
```

Run:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. The Express backend does not need to be running in this mode. MSW intercepts requests to the configured `/api` endpoints in development only.

Development accounts:

| Role | Email | Password |
| --- | --- | --- |
| Student (John) | `student@skillswap.test` | `Password123!` |
| Student (Maya) | `maya@skillswap.test` | `Password123!` |
| Administrator | `admin@skillswap.test` | `Password123!` |

The login page provides buttons for the main student and administrator accounts when mock mode is enabled. The buttons only populate the form; login still uses the normal Axios authentication flow.

Mutable mock data is stored in browser `localStorage` under `skillswap_mock_state`. Requests, sessions, reviews, profile updates, skills, and account status changes survive logout, account switching, and page refresh.

To restore the original mock seed data, open the browser developer console and run:

```js
resetMockState()
```

Refresh the page afterward. Clearing site storage also removes saved authentication and mock state.

Mock mode is guarded by both `import.meta.env.DEV` and `VITE_USE_MOCK_API === "true"`. It cannot start from a production build.

### Mode 2: Real Express backend

Use this mode when the backend and its Supabase environment are configured:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_MOCK_API=false
```

The flag may also be omitted. Start the backend separately, then run:

```bash
npm run dev
```

All frontend requests will go through the centralized Axios client to the real Express REST API. The temporary mock accounts do not exist in real mode unless equivalent users have been created in the real backend.

### Mode 3: Production build and local preview

Create an optimized build with:

```bash
npm run build
```

Preview it locally with:

```bash
npm run preview
```

The production environment must provide the deployed Express API URL as `VITE_API_BASE_URL`. Setting `VITE_USE_MOCK_API=true` does not activate MSW in a production build.

## Testing and quality checks

Run the unit and integration test suite once:

```bash
npm test
```

Run the other project checks:

```bash
npm run typecheck
npm run lint
npm run build
```

The Vitest and React Testing Library suite covers critical behavior including:

- authentication storage and state changes
- Axios authorization headers
- login validation and protected routing
- student and administrator route authorization
- profile rendering and skill mutations
- Discover loading, results, and empty states
- accepting and declining requests
- shared mock request visibility across John and Maya
- session scheduling validation
- review validation and submission
- date/time and match-quality utilities

Playwright is not currently configured. A future real browser E2E suite should use at least two isolated student accounts because sending and receiving a SkillSwap request are different user roles in the same exchange.

## Manual mock workflow

Use this flow to exercise the main student lifecycle:

1. Reset mock state if necessary.
2. Log in as John (`student@skillswap.test`).
3. Open Discover and find Maya Johnson.
4. Request English and offer Mathematics.
5. Confirm the request appears under Requests -> Outgoing as pending.
6. Log out and log in as Maya (`maya@skillswap.test`).
7. Confirm the same request appears under Requests -> Incoming.
8. Accept the request and schedule a session.
9. Mark the scheduled session as completed.
10. Submit a rating and optional review comment.
11. Switch back to John to confirm the shared accepted request state remains available.

Use the administrator account to verify the admin dashboard, student enable/disable controls, and skill creation/editing/disabling. Student accounts should not be able to open protected administrator routes or call mock administrator endpoints successfully.

## Completed frontend scope

- Environment-based API selection
- Centralized Axios client with Bearer token handling and normalized API errors
- Authentication persistence, login, registration, logout, and protected routes
- Responsive student application shell and role-aware administrator navigation
- Profile viewing/editing and offered/wanted skill management
- Student dashboard using existing APIs
- Discover search, documented filters, match presentation, and pagination
- Public peer profiles and SkillSwap request creation
- Incoming/outgoing request management and accepted-contact disclosure
- Session scheduling, completion/cancellation, and review submission
- Administrator statistics, student status management, and skill management
- Responsive and accessibility-focused UI states
- Development-only MSW API with token authorization and persistent state
- Pragmatic Vitest and React Testing Library coverage

## Missing work and current blockers

### Real backend integration

The frontend real-API path is implemented, but end-to-end integration is currently blocked because the backend does not yet have its required `.env` configuration for Supabase and related server settings. The backend developer must create and validate that backend environment file before real login, database-backed profiles, requests, sessions, reviews, and administrator operations can be verified.

Do not place backend secrets in the frontend `.env`. Vite variables are included in client-side code and must never contain Supabase service credentials, database passwords, or other private keys.

Once the backend environment is ready, remaining integration work is:

1. Start the backend and confirm its health/API availability at `http://localhost:4000/api`.
2. Set `VITE_USE_MOCK_API=false` in the frontend.
3. Create or seed real student and administrator accounts in the supported backend workflow.
4. Run the complete two-student request/session/review flow against real data.
5. Verify every response still matches `API_DOCUMENTATION.md`, especially authentication expiry, pagination, contact disclosure, roles, and error envelopes.
6. Record and fix contract mismatches without adding invented frontend endpoints or direct Supabase access.

### Additional meaningful work

- Configure Playwright and deterministic backend test data for critical E2E flows.
- Add automated accessibility checks and responsive browser tests.
- Add deployment-specific frontend and backend environment documentation once hosting is selected.
- Replace the temporary mock workflow as the primary development path after real backend integration is stable; keep it explicitly opt-in if it remains useful for UI development.

## Troubleshooting

If mock requests unexpectedly reach port 4000, confirm that `VITE_USE_MOCK_API=true`, restart Vite, and check that `public/mockServiceWorker.js` is available.

If mock data looks stale, run `resetMockState()` and refresh.

If real API requests fail, confirm that mock mode is disabled, the backend is running, CORS permits the frontend origin, and the backend `.env` is present and valid. A missing backend environment cannot be fixed with frontend Vite variables.
