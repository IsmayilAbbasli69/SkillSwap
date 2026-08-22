# SkillSwap — MVP Product & Technical Design Document

**Document type:** Product Requirements Document (PRD) + Technical Design Document (TDD)  
**Version:** 1.0  
**Status:** Implementation Ready  
**Scope:** Final Project MVP  
**Target stack:** Node.js, Express, Supabase Auth, PostgreSQL, REST API

---

# 1. Product Definition

## 1.1 Product

SkillSwap is a multi-tenant peer-learning platform for educational institutions.

An institution creates a private SkillSwap workspace. Students in that institution create profiles containing:

- skills they can teach,
- skills they want to learn,
- skill levels,
- academic/unit information.

The backend helps students discover relevant peers through:

1. manual skill search;
2. automatic match recommendations;
3. a simple weighted matching algorithm.

After finding a peer, students can send a SkillSwap request, accept/decline it, schedule a session, complete it, and leave a review.

Institution admins can manage students and skills and view basic engagement and skill-demand statistics.

---

# 2. MVP Goals

## 2.1 Goals

The MVP must demonstrate:

- REST API design;
- relational database design;
- authentication;
- role-based authorization;
- tenant isolation;
- CRUD operations;
- search/filtering;
- an explainable matching algorithm;
- request/session workflow;
- basic institutional analytics.

## 2.2 Explicit Non-Goals

Do **not** implement these in the MVP:

- SSO / SAML / Microsoft Entra ID / Google Workspace;
- AI/LLM recommendations;
- Elasticsearch;
- Redis;
- microservices;
- background workers;
- real-time chat;
- skill-credit economy;
- public cross-institution matching;
- advanced analytics;
- CSV bulk import;
- custom institution branding;
- complex availability optimization.

These may be listed as future roadmap features but are not implementation requirements.

---

# 3. Product Roles

## 3.1 Student

Can:

- manage own profile;
- manage offered/wanted skills;
- search for skill partners;
- view matches;
- view peer profiles;
- send requests;
- accept/decline incoming requests;
- schedule a session;
- mark a session completed;
- review a completed session.

## 3.2 Institution Admin

Can:

- view students belonging to their institution;
- enable/disable student accounts;
- manage institution skills;
- view basic institutional statistics.

Admin can never access another institution's students or data.

---

# 4. Core Domain Concepts

## 4.1 Institution

The paying customer / tenant.

Examples:

- university;
- school;
- tutoring center.

Every student belongs to exactly one institution.

## 4.2 Unit

A subdivision of an institution.

Examples:

- Engineering School;
- Main Campus;
- Business Faculty;
- Branch 1.

A student may optionally belong to a unit.

## 4.3 Profile

Application-level user information associated with the authenticated Supabase user.

## 4.4 Skill

Canonical skill managed by the institution/application.

Examples:

- English;
- Mathematics;
- Python;
- SQL.

Students must select canonical skills rather than entering arbitrary skill names.

## 4.5 User Skill

Relationship between a student and a skill.

Two types:

- `OFFER`: student can help with this skill;
- `WANT`: student needs help with this skill.

## 4.6 SkillSwap Request

A request from one student to another.

Lifecycle:

`PENDING -> ACCEPTED`

or

`PENDING -> DECLINED`

## 4.7 Session

A scheduled learning exchange associated with an accepted request.

Lifecycle:

`SCHEDULED -> COMPLETED`

## 4.8 Review

A rating/comment submitted after a completed session.

---

# 5. Architecture

## 5.1 High-Level Architecture

```text
Browser / Frontend
       |
       | HTTPS + JSON
       v
Express REST API
       |
       +----------------------+
       |                      |
       v                      v
Middleware              Controllers
Auth / Role / Tenant          |
                              v
                           Services
                              |
                  +-----------+-----------+
                  |                       |
                  v                       v
             Repositories          Matching Service
                  |
                  v
             Supabase
          PostgreSQL + Auth
```

## 5.2 Architectural Rules

### Routes

Routes only map HTTP endpoints to controller functions.

Routes must not contain business logic or SQL.

### Controllers

Controllers handle:

- request parsing;
- parameter extraction;
- service invocation;
- HTTP status codes;
- response formatting.

Controllers must not contain SQL.

### Services

Services contain business rules.

Examples:

- preventing self-requests;
- checking institution membership;
- validating request transitions;
- calculating match scores;
- determining whether a session can be reviewed.

### Repositories

Repositories are responsible for data access.

Repositories hide the persistence implementation from the service layer.

During early development repositories may use JSON mock data.

Later they will use Supabase/PostgreSQL.

### Middleware

Middleware handles cross-cutting concerns:

- authentication;
- role checks;
- global error handling.

Tenant access must be enforced server-side.

---

# 6. Folder Structure

```text
skillswap/
│
├── src/
│   │
│   ├── config/
│   │   ├── env.js
│   │   └── supabase.js
│   │
│   ├── controllers/
│   │   ├── profile.controller.js
│   │   ├── skill.controller.js
│   │   ├── search.controller.js
│   │   ├── request.controller.js
│   │   ├── session.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/
│   │   ├── profile.service.js
│   │   ├── skill.service.js
│   │   ├── search.service.js
│   │   ├── matching.service.js
│   │   ├── request.service.js
│   │   ├── session.service.js
│   │   └── admin.service.js
│   │
│   ├── repositories/
│   │   ├── profile.repository.js
│   │   ├── skill.repository.js
│   │   ├── request.repository.js
│   │   ├── session.repository.js
│   │   └── admin.repository.js
│   │
│   ├── routes/
│   │   ├── profile.routes.js
│   │   ├── skill.routes.js
│   │   ├── search.routes.js
│   │   ├── request.routes.js
│   │   ├── session.routes.js
│   │   └── admin.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── role.js
│   │   └── error.js
│   │
│   ├── utils/
│   │   ├── http-error.js
│   │   └── pagination.js
│   │
│   ├── data/
│   │   └── seed/
│   │       ├── institutions.json
│   │       ├── profiles.json
│   │       └── skills.json
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── matching/
│   ├── services/
│   └── routes/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Do not create files solely because a "professional architecture" diagram looks impressive. A file earns its existence by owning a real responsibility.

---

# 7. Database Design

## 7.1 Tables

The MVP uses these application tables:

```text
institutions
institution_units
profiles
skills
user_skills
swap_requests
sessions
reviews
```

Supabase Auth manages authentication identities separately.

---

## 7.2 institutions

```text
institutions
------------
id              UUID PK
name            VARCHAR
type            VARCHAR
status          VARCHAR
created_at      TIMESTAMP
```

Suggested `type` values:

```text
SCHOOL
UNIVERSITY
DISTRICT
TUTORING_CENTER
TRAINING_CENTER
```

Suggested `status` values:

```text
ACTIVE
INACTIVE
```

---

## 7.3 institution_units

```text
institution_units
-----------------
id                UUID PK
institution_id    UUID FK -> institutions.id
name              VARCHAR
type              VARCHAR
created_at        TIMESTAMP
```

Examples:

```text
University A
  -> Engineering Campus
  -> Business School
```

---

## 7.4 profiles

```text
profiles
--------
id                  UUID PK
institution_id      UUID FK -> institutions.id
unit_id             UUID FK -> institution_units.id NULL
first_name          VARCHAR
last_name           VARCHAR
bio                 TEXT
avatar_url          TEXT NULL
department          VARCHAR NULL
academic_year       INTEGER NULL
role                VARCHAR
status              VARCHAR
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

`id` corresponds to the Supabase Auth user ID.

Roles:

```text
STUDENT
ADMIN
```

Statuses:

```text
ACTIVE
DISABLED
```

---

## 7.5 skills

```text
skills
------
id              UUID PK
institution_id  UUID FK -> institutions.id NULL
name            VARCHAR
category        VARCHAR NULL
created_at      TIMESTAMP
```

Recommended model:

- `institution_id = NULL`: global/default skill;
- `institution_id != NULL`: institution-specific skill.

This keeps the MVP flexible without requiring a separate global skill service.

---

## 7.6 user_skills

```text
user_skills
-----------
id          UUID PK
user_id     UUID FK -> profiles.id
skill_id    UUID FK -> skills.id
type        VARCHAR
level       VARCHAR
created_at  TIMESTAMP
```

Type:

```text
OFFER
WANT
```

Level:

```text
BEGINNER
INTERMEDIATE
ADVANCED
```

Recommended unique constraint:

```text
(user_id, skill_id, type)
```

---

## 7.7 swap_requests

```text
swap_requests
-------------
id                  UUID PK
institution_id      UUID FK -> institutions.id
sender_id           UUID FK -> profiles.id
receiver_id         UUID FK -> profiles.id
requested_skill_id  UUID FK -> skills.id
offered_skill_id    UUID FK -> skills.id NULL
message             TEXT NULL
status              VARCHAR
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

Status:

```text
PENDING
ACCEPTED
DECLINED
```

---

## 7.8 sessions

```text
sessions
--------
id              UUID PK
swap_request_id UUID FK -> swap_requests.id
scheduled_at    TIMESTAMP
duration        INTEGER
meeting_type    VARCHAR
status          VARCHAR
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Meeting type:

```text
ONLINE
IN_PERSON
```

Status:

```text
SCHEDULED
COMPLETED
CANCELLED
```

---

## 7.9 reviews

```text
reviews
-------
id              UUID PK
session_id      UUID FK -> sessions.id
reviewer_id     UUID FK -> profiles.id
reviewee_id     UUID FK -> profiles.id
rating          INTEGER
comment         TEXT NULL
created_at      TIMESTAMP
```

Constraints:

- rating between 1 and 5;
- only participants can review;
- session must be completed;
- one review per reviewer per session.

---

# 8. Relationships

```text
institutions
    |
    +----< institution_units
    |
    +----< profiles
              |
              +----< user_skills >---- skills
              |
              +----< swap_requests
              |
              +----< reviews

swap_requests
    |
    +---- sessions
            |
            +---- reviews
```

Every student query must be scoped to the student's `institution_id`.

---

# 9. Authentication and Tenant Isolation

## 9.1 Authentication

Supabase Auth handles:

- registration;
- login;
- password management;
- session/JWT.

The backend validates the authenticated identity and loads the application profile.

## 9.2 Authentication Middleware

Pseudo-flow:

```text
Request
  ↓
Authorization: Bearer <token>
  ↓
Validate Supabase token
  ↓
Get auth user ID
  ↓
Load profile
  ↓
Attach user to req.user
  ↓
Controller
```

Example `req.user`:

```js
{
  id: "uuid",
  institutionId: "uuid",
  unitId: "uuid",
  role: "STUDENT",
  status: "ACTIVE"
}
```

## 9.3 Tenant Isolation Rule

The server must derive the institution from the authenticated profile.

Never trust a client-supplied `institution_id` to determine access.

Bad:

```http
GET /api/search?institution_id=other-institution
```

Good:

```text
authenticated user
       ↓
profile.institution_id
       ↓
server-side tenant scope
```

---

# 10. API Conventions

Base URL:

```text
/api
```

All request/response bodies use JSON.

Authentication:

```http
Authorization: Bearer <supabase-access-token>
```

Success response format:

```json
{
  "data": {}
}
```

Collection response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

Error response:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Profile not found"
  }
}
```

Recommended HTTP codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

---

# 11. Endpoint Specification

## 11.1 Profile

### GET /api/profile/me

Returns the authenticated user's profile.

Response:

```json
{
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Smith",
    "bio": "Computer science student",
    "department": "Engineering",
    "academicYear": 2,
    "role": "STUDENT",
    "status": "ACTIVE",
    "institution": {
      "id": "uuid",
      "name": "Horizon University"
    },
    "unit": {
      "id": "uuid",
      "name": "Engineering School"
    }
  }
}
```

### PATCH /api/profile/me

Updates the authenticated user's editable profile fields.

Request:

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "bio": "Computer science student",
  "department": "Engineering",
  "academicYear": 2
}
```

Response: `200`

---

## 11.2 Skills

### GET /api/skills

Returns skills available to the authenticated institution.

Query:

```text
?search=eng
?category=language
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "English",
      "category": "Language"
    }
  ]
}
```

### POST /api/profile/me/skills

Adds a skill to the authenticated user's profile.

Request:

```json
{
  "skillId": "uuid",
  "type": "OFFER",
  "level": "ADVANCED"
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "skillId": "uuid",
    "type": "OFFER",
    "level": "ADVANCED"
  }
}
```

### DELETE /api/profile/me/skills/:userSkillId

Removes a skill from the current user's profile.

Response: `204`

---

# 12. Search API

## GET /api/search

Purpose:

Find students in the same institution who can provide a requested skill.

Query parameters:

```text
skillId       required
unitId        optional
level         optional
page          optional, default 1
limit         optional, default 20, max 50
```

Example:

```http
GET /api/search?skillId=abc123&unitId=unit456&level=INTERMEDIATE
```

Backend process:

```text
1. Authenticate user
2. Get current user's institution_id
3. Resolve requested skill
4. Find active profiles in the same institution
5. Exclude current user
6. Require OFFER relationship for requested skill
7. Apply optional unit/level filters
8. Load candidate skill relationships
9. Calculate match score
10. Sort descending by score
11. Return ranked results
```

Response:

```json
{
  "data": [
    {
      "profile": {
        "id": "uuid",
        "name": "Maya Johnson",
        "bio": "Business student",
        "department": "Business",
        "unit": {
          "id": "uuid",
          "name": "Main Campus"
        }
      },
      "skill": {
        "id": "uuid",
        "name": "English",
        "level": "ADVANCED"
      },
      "match": {
        "score": 100,
        "category": "EXCELLENT",
        "reciprocal": true
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12
  }
}
```

---

# 13. Matching Engine

File:

```text
src/services/matching.service.js
```

Public service:

```js
calculateMatchScore(currentUser, candidate, context)
```

## 13.1 Mandatory Eligibility Rules

Candidate must:

- belong to same institution;
- have `ACTIVE` status;
- not be current user;
- offer the requested skill;
- be visible under institution rules.

## 13.2 Score

```text
Reciprocal skill             +50
Same unit                    +20
Suitable skill level         +30
                              ---
                              100
```

## 13.3 Reciprocal Skill

If:

```text
Current user WANTS English
Candidate OFFERS English
```

candidate passes the primary search condition.

If also:

```text
Candidate WANTS Mathematics
Current user OFFERS Mathematics
```

then the match is reciprocal.

Score: `+50`.

## 13.4 Same Unit

```text
currentUser.unit_id === candidate.unit_id
```

Score: `+20`.

If the unit is missing or different, add `0`.

## 13.5 Skill Level

Suggested ordering:

```text
BEGINNER < INTERMEDIATE < ADVANCED
```

A candidate's offered level is suitable if it meets or exceeds the learner's requested level.

Score: `+30`.

## 13.6 Categories

```text
75 - 100: EXCELLENT
50 - 74:  GOOD
1 - 49:   AVAILABLE
0:        NOT_MATCHED
```

The UI displays categories rather than forcing users to interpret a numeric score.

---

# 14. Request API

## POST /api/requests

Creates a SkillSwap request.

Request:

```json
{
  "receiverId": "uuid",
  "requestedSkillId": "uuid",
  "offeredSkillId": "uuid",
  "message": "I can help with Mathematics in exchange for English."
}
```

Rules:

- sender is current authenticated user;
- sender cannot request themselves;
- sender and receiver must belong to same institution;
- requested skill must be relevant to receiver;
- offered skill must be relevant to sender if supplied;
- both users must be active;
- duplicate active request should be rejected.

Response: `201`

```json
{
  "data": {
    "id": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "requestedSkillId": "uuid",
    "offeredSkillId": "uuid",
    "message": "I can help with Mathematics in exchange for English.",
    "status": "PENDING",
    "createdAt": "2026-08-22T12:00:00Z"
  }
}
```

## GET /api/requests

Returns requests involving the authenticated user.

Query:

```text
?type=incoming
?type=outgoing
?status=PENDING
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "status": "PENDING",
      "sender": {
        "id": "uuid",
        "name": "John Smith"
      },
      "receiver": {
        "id": "uuid",
        "name": "Maya Johnson"
      },
      "requestedSkill": {
        "id": "uuid",
        "name": "English"
      }
    }
  ]
}
```

## PATCH /api/requests/:id

Updates request state.

Request:

```json
{
  "status": "ACCEPTED"
}
```

Allowed transitions:

```text
PENDING -> ACCEPTED
PENDING -> DECLINED
```

Any other transition returns `409 Conflict`.

Only the receiver may accept/decline a pending request.

---

# 15. Sessions

## POST /api/requests/:requestId/session

Creates a session for an accepted request.

Request:

```json
{
  "scheduledAt": "2026-08-27T16:00:00Z",
  "duration": 60,
  "meetingType": "ONLINE"
}
```

Rules:

- request must be `ACCEPTED`;
- requester must participate in the request;
- one active session per request for the MVP.

Response: `201`

```json
{
  "data": {
    "id": "uuid",
    "requestId": "uuid",
    "scheduledAt": "2026-08-27T16:00:00Z",
    "duration": 60,
    "meetingType": "ONLINE",
    "status": "SCHEDULED"
  }
}
```

## GET /api/sessions

Returns sessions involving current user.

Query:

```text
?status=SCHEDULED
```

## PATCH /api/sessions/:id

Allowed updates:

```text
SCHEDULED -> COMPLETED
SCHEDULED -> CANCELLED
```

Only participants can update.

---

# 16. Reviews

## POST /api/sessions/:sessionId/review

Request:

```json
{
  "revieweeId": "uuid",
  "rating": 5,
  "comment": "Very helpful session."
}
```

Rules:

- session must be `COMPLETED`;
- reviewer must be a participant;
- reviewee must be the other participant;
- reviewer can review once.

Response: `201`

```json
{
  "data": {
    "id": "uuid",
    "rating": 5,
    "comment": "Very helpful session."
  }
}
```

---

# 17. Admin API

Admin endpoints must use:

```text
auth middleware
      +
role middleware (ADMIN)
      +
tenant scoping
```

## GET /api/admin/students

Returns students in the admin's institution.

Query:

```text
?page=1
&limit=20
&status=ACTIVE
&search=john
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Smith",
      "unit": "Engineering School",
      "status": "ACTIVE"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 57
  }
}
```

## PATCH /api/admin/students/:id/status

Request:

```json
{
  "status": "DISABLED"
}
```

Admin can only update students in their own institution.

---

# 18. Admin Skills

## POST /api/admin/skills

Request:

```json
{
  "name": "Database Systems",
  "category": "Computer Science"
}
```

Response: `201`

## PATCH /api/admin/skills/:id

Updates skill name/category.

## DELETE /api/admin/skills/:id

Delete only if not referenced, or soft-delete if the team decides to preserve historical data.

For the MVP, soft disabling is safer than hard deletion:

```text
status = INACTIVE
```

---

# 19. Admin Statistics

## GET /api/admin/stats

Response:

```json
{
  "data": {
    "students": {
      "total": 120,
      "active": 116
    },
    "requests": {
      "total": 240,
      "accepted": 140,
      "pending": 42,
      "declined": 58
    },
    "sessions": {
      "scheduled": 34,
      "completed": 96
    },
    "topWantedSkills": [
      {
        "skill": "English",
        "count": 43
      },
      {
        "skill": "Python",
        "count": 31
      }
    ],
    "topOfferedSkills": [
      {
        "skill": "Mathematics",
        "count": 37
      }
    ]
  }
}
```

These are normal aggregate SQL queries. No analytics infrastructure is required.

---

# 20. Business Rules

## Tenant Rules

1. A student belongs to exactly one institution.
2. A student can only discover users in the same institution.
3. Admins only manage their own institution.
4. Institution ID comes from the authenticated profile.
5. Client input must never override tenant scope.

## Profile Rules

1. Student can edit only their own profile.
2. Student must be active to use matching/search.
3. Disabled students cannot create requests.

## Skill Rules

1. Skills should use canonical IDs.
2. A user cannot have duplicate `(skill_id, type)` entries.
3. A skill can exist globally or be institution-specific.

## Request Rules

1. Cannot request yourself.
2. Sender and receiver must share institution.
3. Request must be `PENDING` before accept/decline.
4. Only receiver can accept/decline.
5. Duplicate active requests should be prevented.

## Session Rules

1. Session requires accepted request.
2. Only request participants can manage it.
3. Only completed sessions can be reviewed.

---

# 21. Controller / Service / Repository Example

## Route

```js
router.get("/", searchController.search);
```

## Controller

```js
const search = async (req, res, next) => {
  try {
    const result = await searchService.searchStudents({
      currentUser: req.user,
      skillId: req.query.skillId,
      unitId: req.query.unitId,
      level: req.query.level,
      page: req.query.page,
      limit: req.query.limit
    });

    res.status(200).json({ data: result.data, meta: result.meta });
  } catch (error) {
    next(error);
  }
};
```

## Service

```js
const searchStudents = async ({
  currentUser,
  skillId,
  unitId,
  level,
  page,
  limit
}) => {
  const candidates = await profileRepository.findSkillCandidates({
    institutionId: currentUser.institutionId,
    currentUserId: currentUser.id,
    skillId,
    unitId,
    level,
    page,
    limit
  });

  const ranked = candidates
    .map(candidate => ({
      ...candidate,
      match: matchingService.calculateMatchScore(
        currentUser,
        candidate
      )
    }))
    .sort((a, b) => b.match.score - a.match.score);

  return {
    data: ranked,
    meta: {
      page,
      limit,
      total: ranked.length
    }
  };
};
```

## Repository

```js
const findSkillCandidates = async ({
  institutionId,
  currentUserId,
  skillId,
  unitId,
  level,
  page,
  limit
}) => {
  // Supabase query lives here.
};
```

The important architectural rule:

```text
Controller does not know SQL.
Service does not know Supabase syntax.
Repository does not decide business rules.
```

---

# 22. Search Query Strategy

For the MVP, let PostgreSQL perform candidate filtering and Node.js perform ranking.

## Database responsibilities

- same institution filter;
- active status;
- requested skill;
- current-user exclusion;
- optional unit filter;
- optional level filter;
- pagination.

## Node.js responsibilities

- reciprocal detection;
- scoring;
- score category;
- final ranking.

This is a reasonable division for an educational project.

---

# 23. Indexes

Do not prematurely optimize.

Add only indexes that support obvious access patterns:

```text
profiles(institution_id)
profiles(institution_id, status)
profiles(unit_id)

user_skills(user_id)
user_skills(skill_id)
user_skills(skill_id, type)

swap_requests(sender_id)
swap_requests(receiver_id)
swap_requests(institution_id)

sessions(swap_request_id)

reviews(session_id)
```

For an MVP with hundreds or a few thousand users, PostgreSQL is more than sufficient for the described workload.

---

# 24. Error Handling

Create a consistent error class:

```js
class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
```

Global middleware:

```js
app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message:
        status === 500
          ? "Internal server error"
          : err.message
    }
  });
});
```

Do not expose database internals to clients.

Bad:

```json
{
  "error": "PostgREST foreign key violation..."
}
```

Good:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The selected receiver is not available."
  }
}
```

---

# 25. Validation

Use a simple request validation library or lightweight validators.

Validate:

- required fields;
- UUID format;
- enum values;
- rating range;
- pagination range;
- text length.

Example:

```text
rating: 1-5
limit: 1-50
duration: 15-180
```

Do not build a custom validation framework for a final project.

---

# 26. Recommended API Route Map

```text
AUTH
Handled primarily by Supabase Auth

PROFILE
GET    /api/profile/me
PATCH  /api/profile/me

SKILLS
GET    /api/skills
POST   /api/profile/me/skills
DELETE /api/profile/me/skills/:id

SEARCH
GET    /api/search

REQUESTS
GET    /api/requests
POST   /api/requests
PATCH  /api/requests/:id

SESSIONS
GET    /api/sessions
POST   /api/requests/:requestId/session
PATCH  /api/sessions/:id

REVIEWS
POST   /api/sessions/:sessionId/review

ADMIN
GET    /api/admin/students
PATCH  /api/admin/students/:id/status

POST   /api/admin/skills
PATCH  /api/admin/skills/:id
DELETE /api/admin/skills/:id

GET    /api/admin/stats
```

This is intentionally small.

---

# 27. Main User Flows

## 27.1 Student Onboarding

```text
Register with Supabase
      ↓
Authenticated
      ↓
Create/load profile
      ↓
Institution membership
      ↓
Select unit
      ↓
Add OFFER skills
      ↓
Add WANT skills
      ↓
Dashboard
```

## 27.2 Search

```text
Student chooses "English"
      ↓
GET /api/search?skillId=...
      ↓
Tenant scoped PostgreSQL query
      ↓
Candidate list
      ↓
Matching service
      ↓
Ranked response
      ↓
Frontend cards
```

## 27.3 Request

```text
View candidate
      ↓
Send request
      ↓
PENDING
      ↓
Receiver accepts
      ↓
ACCEPTED
      ↓
Schedule session
```

## 27.4 Completion

```text
Scheduled
    ↓
Session happens
    ↓
Mark COMPLETED
    ↓
Review
```

## 27.5 Admin

```text
Admin login
     ↓
JWT
     ↓
Load profile
     ↓
role === ADMIN
     ↓
Tenant-scoped admin endpoints
     ↓
Dashboard
```

---

# 28. Implementation Order

Build in this order.

## Phase 1 — Project foundation

- Express setup;
- environment variables;
- error middleware;
- routes/controllers/services/repositories;
- Supabase client configuration.

## Phase 2 — Authentication

- Supabase Auth;
- auth middleware;
- profile creation;
- role checking.

## Phase 3 — Profile and skills

- profiles;
- institutions;
- units;
- skill CRUD;
- user skill management.

## Phase 4 — Search

- canonical skills;
- skill search;
- same-institution filtering;
- unit filtering;
- pagination.

## Phase 5 — Matching

- candidate retrieval;
- reciprocal detection;
- score calculation;
- ranking;
- match categories.

## Phase 6 — Swap workflow

- create request;
- list requests;
- accept/decline;
- validation of transitions.

## Phase 7 — Sessions and reviews

- schedule;
- complete;
- review.

## Phase 8 — Admin

- student list;
- disable student;
- skill management;
- statistics.

## Phase 9 — Frontend polish

- dashboard;
- search cards;
- request states;
- mobile responsive UI.

## Phase 10 — Final testing

- tenant isolation;
- role protection;
- request state transitions;
- matching scenarios;
- error cases.

---

# 29. Testing Strategy

The project does not need a giant enterprise test suite.

Focus on high-value tests.

## Matching tests

### Case 1 — Perfect reciprocal match

Expected:

```text
score = 100
category = EXCELLENT
```

### Case 2 — Skill match only

Expected:

```text
score < 75
category = AVAILABLE
```

### Case 3 — Different institution

Expected:

```text
candidate excluded
```

### Case 4 — Same unit

Expected:

```text
+20
```

### Case 5 — Current user

Expected:

```text
candidate excluded
```

## Request tests

- sender cannot request self;
- receiver can accept;
- receiver can decline;
- sender cannot accept own request;
- accepted request cannot be accepted twice;
- duplicate active request is rejected.

## Authorization tests

- unauthenticated request -> `401`;
- student accessing admin endpoint -> `403`;
- admin from Institution A accessing Institution B -> `403` or empty tenant-scoped result;
- student cannot edit another profile.

---

# 30. Definition of Done

The MVP is complete when:

### Auth

- user can register/login;
- authenticated API endpoints reject unauthenticated requests.

### Tenant

- users only see their institution's users;
- admins only manage their institution.

### Profile

- student can edit profile;
- student can add/remove offered/wanted skills.

### Search

- user can search by skill;
- search is institution scoped;
- search results can be filtered by unit;
- results return candidate skill information.

### Matching

- score is calculated;
- reciprocal matches are detected;
- results are ranked;
- category is returned.

### Requests

- request can be created;
- receiver can accept/decline;
- invalid transitions are rejected.

### Sessions

- accepted request can be scheduled;
- session can be completed.

### Reviews

- completed session can be reviewed.

### Admin

- admin can list/disable students;
- admin can manage skills;
- admin can see basic statistics.

---

# 31. Future Roadmap

These are explicitly outside MVP:

## Phase 2

- institutional email domain verification;
- invitation-code management;
- richer availability;
- notifications;
- better profile discovery.

## Phase 3

- skill credits;
- recurring sessions;
- in-app chat;
- advanced analytics.

## Phase 4

- SSO;
- CSV student import;
- custom branding;
- cross-institution network;
- dedicated search infrastructure.

---

# 32. Architecture Decision Summary

| Decision | MVP Choice | Reason |
|---|---|---|
| Backend | Node.js + Express | Simple REST API and strong learning value |
| Database | Supabase PostgreSQL | Relational data + easy hosted setup |
| Authentication | Supabase Auth | Avoid custom password/security implementation |
| Architecture | Modular monolith | Easy to develop and explain |
| Data layer | Repository pattern | Allows JSON -> Supabase transition |
| Matching | Node.js service | Easy to understand and demonstrate |
| Search | PostgreSQL | No need for Elasticsearch |
| Caching | None | Not justified for MVP |
| Jobs | None | Dashboard-time matching is sufficient |
| Microservices | None | Unnecessary complexity |
| AI | None | Matching rules are deterministic and explainable |
| Tenant model | Institution ID | Clear B2B isolation |
| Roles | STUDENT / ADMIN | Enough for MVP |
| Availability | Manual scheduling | Keeps matching manageable |

---

# 33. Final Technical Mental Model

The entire backend should be understandable as:

```text
                 ┌───────────────┐
                 │   Supabase    │
                 │ Auth + DB     │
                 └───────┬───────┘
                         │
                         v
                 ┌───────────────┐
                 │   Express     │
                 │ REST API      │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │  Middleware   │
                 │ Auth / Role   │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │ Controllers   │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │   Services    │
                 │ Business Logic│
                 └───────┬───────┘
                         │
             ┌───────────┴───────────┐
             v                       v
     ┌──────────────┐       ┌────────────────┐
     │ Repositories │       │ Matching       │
     │ Data Access  │       │ Algorithm      │
     └──────┬───────┘       └────────────────┘
            │
            v
       PostgreSQL
```

The key engineering principle is:

```text
Routes
  know HTTP paths.

Controllers
  know HTTP requests/responses.

Services
  know business rules.

Repositories
  know data access.

Database
  stores data.

Middleware
  enforces authentication/authorization.
```

That separation is enough to make the project technically credible without turning a student final project into a fake enterprise platform.
