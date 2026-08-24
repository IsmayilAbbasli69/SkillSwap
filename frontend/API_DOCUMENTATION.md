# SkillSwap API Documentation v1.1
**Frontend Developer Reference — Complete Endpoint Guide**

> **Base URL**: `http://localhost:4000/api`  
> **Auth Scheme**: JWT Bearer Token  
> **Version**: 1.1.0 — Zero-Chat, Direct Disclosure Architecture

---

## Global Conventions

### Authentication Header
All protected endpoints require the JWT token:
```http
Authorization: Bearer <your_jwt_access_token>
```

### Standard Response Envelope
```json
{ "data": { ... } }
```

### Paginated Response Envelope
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

### Error Response Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | RESOURCE_NOT_FOUND | CONFLICT | INTERNAL_ERROR",
    "message": "Human readable description"
  }
}
```

### CORS
All origins and methods are allowed (configured for development/testing). No preflight setup required.

---

## 1. Authentication (`/api/auth`)

### 1.1 Sign Up
Registers a new student account, creates a profile, and returns a session token.

- **Method**: `POST`
- **URL**: `/api/auth/signup`
- **Auth**: ❌ Public
- **Body**:
```json
{
  "email": "student@university.edu",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Computer Science undergrad passionate about React & AI.",
  "department": "Computer Science",
  "academicYear": 3,
  "institutionId": "11111111-1111-4111-8111-111111111111",
  "unitId": "22222222-2222-4222-8222-222222222222"
}
```
> `institutionId`, `unitId`, `bio`, `department`, `academicYear` are optional.

- **Response `201`**:
```json
{
  "data": {
    "user": {
      "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
      "email": "student@university.edu"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": 1787416028
    },
    "requiresEmailConfirmation": false
  }
}
```

---

### 1.2 Login
Authenticates a user and returns a session token.

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: ❌ Public
- **Body**:
```json
{
  "email": "student@university.edu",
  "password": "SecurePassword123!"
}
```
- **Response `200`**:
```json
{
  "data": {
    "user": {
      "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
      "email": "student@university.edu"
    },
    "session": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": 1787416028
    }
  }
}
```

---

## 2. Profile (`/api/profile`)

### 2.1 Get My Profile ⭐ *Updated in v1.1*
Fetches the full authenticated user profile, now including **skills array** and **review stats**.

- **Method**: `GET`
- **URL**: `/api/profile/me`
- **Auth**: ✅ Required
- **Response `200`**:
```json
{
  "data": {
    "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Computer Science undergrad passionate about React & AI.",
    "department": "Computer Science",
    "academicYear": 3,
    "avatarUrl": "https://cdn.example.com/avatars/john.jpg",
    "role": "STUDENT",
    "status": "ACTIVE",
    "averageRating": 4.85,
    "totalReviews": 12,
    "institution": {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "Tech University"
    },
    "unit": {
      "id": "22222222-2222-4222-8222-222222222222",
      "name": "Faculty of Engineering"
    },
    "skills": [
      {
        "id": "user-skill-uuid-1",
        "skillId": "33333333-3333-4333-8333-333333333333",
        "name": "JavaScript",
        "type": "OFFER",
        "level": "ADVANCED"
      },
      {
        "id": "user-skill-uuid-2",
        "skillId": "55555555-5555-4555-8555-555555555555",
        "name": "UI/UX Design",
        "type": "WANT",
        "level": "BEGINNER"
      }
    ]
  }
}
```

---

### 2.2 Update My Profile
Updates editable profile fields.

- **Method**: `PATCH`
- **URL**: `/api/profile/me`
- **Auth**: ✅ Required
- **Body** (all optional):
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "bio": "Updated bio text",
  "department": "Software Engineering",
  "academicYear": 4
}
```
- **Response `200`**: Same shape as `GET /api/profile/me`.

---

### 2.3 Add Skill to Profile
Attaches a skill to the user's profile as OFFER or WANT.

- **Method**: `POST`
- **URL**: `/api/profile/me/skills`
- **Auth**: ✅ Required
- **Body**:
```json
{
  "skillId": "33333333-3333-4333-8333-333333333333",
  "type": "OFFER",
  "level": "INTERMEDIATE"
}
```
> `type`: `"OFFER"` or `"WANT"` | `level`: `"BEGINNER"`, `"INTERMEDIATE"`, or `"ADVANCED"`

- **Response `201`**:
```json
{
  "data": {
    "id": "44444444-4444-4444-8444-444444444444",
    "skillId": "33333333-3333-4333-8333-333333333333",
    "type": "OFFER",
    "level": "INTERMEDIATE"
  }
}
```

---

### 2.4 Remove Skill from Profile
Deletes a skill from the user's profile.

- **Method**: `DELETE`
- **URL**: `/api/profile/me/skills/:userSkillId`
- **Auth**: ✅ Required
- **Response**: `204 No Content` *(empty body)*

---

## 3. Public Peer Profiles (`/api/users`) 🆕 *New in v1.1*

### 3.1 Get Peer Profile
Fetches a peer student's public profile — including their skills, rating, and recent reviews. Enables informed decisions before sending a swap request. Users can only view peers in the same institution.

- **Method**: `GET`
- **URL**: `/api/users/:userId`
- **Auth**: ✅ Required
- **Response `200`**:
```json
{
  "data": {
    "id": "88888888-8888-4888-8888-888888888888",
    "firstName": "Sarah",
    "lastName": "Connor",
    "bio": "Robotics & Embedded Systems student.",
    "department": "Computer Science",
    "academicYear": 4,
    "avatarUrl": "https://cdn.example.com/avatars/sarah.jpg",
    "averageRating": 5.0,
    "totalReviews": 8,
    "skills": [
      {
        "id": "user-skill-uuid-3",
        "skillId": "33333333-3333-4333-8333-333333333333",
        "name": "Python",
        "type": "OFFER",
        "level": "ADVANCED"
      },
      {
        "id": "user-skill-uuid-4",
        "skillId": "55555555-5555-4555-8555-555555555555",
        "name": "Graphic Design",
        "type": "WANT",
        "level": "BEGINNER"
      }
    ],
    "recentReviews": [
      {
        "rating": 5,
        "comment": "Excellent tutor in Python data structures!",
        "createdAt": "2026-08-10T12:00:00.000Z",
        "reviewer": {
          "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
          "name": "John Smith"
        }
      }
    ]
  }
}
```

---

## 4. Skills Catalog (`/api/skills`)

### 4.1 List Visible Skills
Fetches skills available to the user's institution.

- **Method**: `GET`
- **URL**: `/api/skills`
- **Auth**: ✅ Required
- **Query Params**:
  - `search` *(optional)*: e.g. `?search=react`
  - `category` *(optional)*: e.g. `?category=Programming`
- **Response `200`**:
```json
{
  "data": [
    { "id": "33333333-3333-4333-8333-333333333333", "name": "JavaScript", "category": "Programming" },
    { "id": "55555555-5555-4555-8555-555555555555", "name": "UI/UX Design", "category": "Design" }
  ]
}
```

---

## 5. Search & Matchmaking (`/api/search`) ⭐ *Updated in v1.1*

### 5.1 Search / Browse Students
Finds peers who offer a skill, ranked by reciprocal compatibility. **`skillId` is now optional** — omit it to browse all peers in your institution by department.

- **Method**: `GET`
- **URL**: `/api/search`
- **Auth**: ✅ Required
- **Query Params**:
  - `skillId` *(optional, UUID)*: Filter to users who offer this skill
  - `unitId` *(optional, UUID)*: Filter by unit/department
  - `level` *(optional)*: `"BEGINNER"`, `"INTERMEDIATE"`, `"ADVANCED"`
  - `page` *(default: 1)*
  - `limit` *(default: 20)*
- **Response `200`**:
```json
{
  "data": [
    {
      "profile": {
        "id": "88888888-8888-4888-8888-888888888888",
        "name": "Sarah Connor",
        "bio": "Robotics & AI enthusiast",
        "department": "Computer Science",
        "averageRating": 4.9,
        "unit": {
          "id": "22222222-2222-4222-8222-222222222222",
          "name": null
        }
      },
      "offeredSkill": {
        "id": "33333333-3333-4333-8333-333333333333",
        "name": "JavaScript",
        "level": "ADVANCED"
      },
      "match": {
        "score": 95,
        "reasons": ["Reciprocal skill match found", "Same department / institution unit"]
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```
> When `skillId` is omitted, `offeredSkill` will be `null` in each result.

---

## 6. Swap Requests (`/api/requests`)

### 6.1 Create Swap Request
Proposes a skill swap with a peer.

- **Method**: `POST`
- **URL**: `/api/requests`
- **Auth**: ✅ Required
- **Body**:
```json
{
  "receiverId": "88888888-8888-4888-8888-888888888888",
  "requestedSkillId": "33333333-3333-4333-8333-333333333333",
  "offeredSkillId": "55555555-5555-4555-8555-555555555555",
  "message": "Hey! I'd love to learn JavaScript from you in exchange for UI/UX Design."
}
```
> `offeredSkillId` and `message` are optional.

- **Response `201`**:
```json
{
  "data": {
    "id": "99999999-9999-4999-8999-999999999999",
    "senderId": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
    "receiverId": "88888888-8888-4888-8888-888888888888",
    "requestedSkillId": "33333333-3333-4333-8333-333333333333",
    "offeredSkillId": "55555555-5555-4555-8555-555555555555",
    "message": "Hey! I'd love to learn JavaScript...",
    "status": "PENDING",
    "createdAt": "2026-08-22T19:30:00.000Z"
  }
}
```

---

### 6.2 List Swap Requests ⭐ *Updated in v1.1 — Contact Disclosure*
Fetches the authenticated user's swap requests. **When a request is `ACCEPTED`, the peer's `email` is revealed automatically.**

- **Method**: `GET`
- **URL**: `/api/requests`
- **Auth**: ✅ Required
- **Query Params**:
  - `type` *(optional)*: `"incoming"` or `"outgoing"`
  - `status` *(optional)*: `"PENDING"`, `"ACCEPTED"`, or `"DECLINED"`
- **Response `200`**:
```json
{
  "data": [
    {
      "id": "99999999-9999-4999-8999-999999999999",
      "status": "ACCEPTED",
      "message": "Hey! I'd love to learn JavaScript...",
      "createdAt": "2026-08-22T19:30:00.000Z",
      "peer": {
        "id": "88888888-8888-4888-8888-888888888888",
        "name": "Sarah Connor",
        "email": "sarah.connor@university.edu"
      },
      "sender": {
        "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
        "name": "John Doe"
      },
      "receiver": {
        "id": "88888888-8888-4888-8888-888888888888",
        "name": "Sarah Connor"
      },
      "requestedSkill": { "id": "33333333-3333-4333-8333-333333333333", "name": "JavaScript" },
      "offeredSkill": { "id": "55555555-5555-4555-8555-555555555555", "name": "UI/UX Design" }
    }
  ]
}
```
> ⚠️ When status is `"PENDING"` or `"DECLINED"`, the `peer.email` field is **omitted**.

---

### 6.3 Accept or Decline a Request
Only the **receiver** of a request can update its status.

- **Method**: `PATCH`
- **URL**: `/api/requests/:id`
- **Auth**: ✅ Required
- **Body**:
```json
{ "status": "ACCEPTED" }
```
> `status`: `"ACCEPTED"` or `"DECLINED"`

- **Response `200`**:
```json
{
  "data": {
    "id": "99999999-9999-4999-8999-999999999999",
    "status": "ACCEPTED"
  }
}
```

---

### 6.4 Schedule a Session ⭐ *Updated in v1.1 — Meeting Fields*
Creates a session for an accepted request. Supports Google Meet links and campus room notes.

- **Method**: `POST`
- **URL**: `/api/requests/:requestId/session`
- **Auth**: ✅ Required
- **Body**:
```json
{
  "scheduledAt": "2026-08-25T14:00:00.000Z",
  "duration": 60,
  "meetingType": "ONLINE",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "locationNote": "Join Google Meet link above"
}
```
> `duration`: Integer in minutes (15–180) | `meetingType`: `"ONLINE"` or `"IN_PERSON"`  
> `meetingUrl` and `locationNote` are **optional**.

- **Response `201`**:
```json
{
  "data": {
    "id": "77777777-7777-4777-8777-777777777777",
    "requestId": "99999999-9999-4999-8999-999999999999",
    "scheduledAt": "2026-08-25T14:00:00.000Z",
    "duration": 60,
    "meetingType": "ONLINE",
    "meetingUrl": "https://meet.google.com/abc-defg-hij",
    "locationNote": "Join Google Meet link above",
    "status": "SCHEDULED"
  }
}
```

---

## 7. Sessions & Reviews (`/api/sessions`)

### 7.1 List My Sessions
Fetches all sessions the user participates in.

- **Method**: `GET`
- **URL**: `/api/sessions`
- **Auth**: ✅ Required
- **Query Params**:
  - `status` *(optional)*: `"SCHEDULED"`, `"COMPLETED"`, or `"CANCELLED"`
- **Response `200`**:
```json
{
  "data": [
    {
      "id": "77777777-7777-4777-8777-777777777777",
      "requestId": "99999999-9999-4999-8999-999999999999",
      "scheduledAt": "2026-08-25T14:00:00.000Z",
      "duration": 60,
      "meetingType": "ONLINE",
      "meetingUrl": "https://meet.google.com/abc-defg-hij",
      "locationNote": null,
      "status": "SCHEDULED",
      "peer": {
        "id": "88888888-8888-4888-8888-888888888888",
        "name": "Maya Johnson"
      },
      "requestedSkill": {
        "id": "33333333-3333-4333-8333-333333333333",
        "name": "English"
      },
      "offeredSkill": {
        "id": "55555555-5555-4555-8555-555555555555",
        "name": "Mathematics"
      },
      "reviewSubmitted": false
    }
  ]
}
```

`peer` is always the other request participant relative to the authenticated
user. `offeredSkill` may be `null`. `reviewSubmitted` indicates whether the
authenticated user has already reviewed this session. Public peer and reviewer
objects never include email or private contact information.

---

### 7.2 Update Session Status
Marks a scheduled session as completed or cancelled.

- **Method**: `PATCH`
- **URL**: `/api/sessions/:id`
- **Auth**: ✅ Required
- **Body**:
```json
{ "status": "COMPLETED" }
```
> `status`: `"COMPLETED"` or `"CANCELLED"`

- **Response `200`**:
```json
{
  "data": {
    "id": "77777777-7777-4777-8777-777777777777",
    "status": "COMPLETED"
  }
}
```

---

### 7.3 Submit Review
Submit a 1–5 star rating and optional comment for the peer after a **completed** session. Each participant can only submit one review per session.

- **Method**: `POST`
- **URL**: `/api/sessions/:sessionId/review`
- **Auth**: ✅ Required
- **Body**:
```json
{
  "revieweeId": "88888888-8888-4888-8888-888888888888",
  "rating": 5,
  "comment": "Super patient tutor! Highly recommended."
}
```
> `rating`: Integer 1–5 | `comment` is optional

- **Response `201`**:
```json
{
  "data": {
    "id": "aaaa1111-bbbb-cccc-dddd-eeeeffff0000",
    "rating": 5,
    "comment": "Super patient tutor! Highly recommended."
  }
}
```

---

## 8. Admin (`/api/admin`) *(Role: ADMIN only)*

> All admin routes require an authenticated user with `role: "ADMIN"`.

### 8.1 List Students
- **Method**: `GET` | **URL**: `/api/admin/students`
- **Query Params**: `status` (`ACTIVE`|`DISABLED`), `search`, `page`, `limit`
- **Response `200`**:
```json
{
  "data": [
    { "id": "...", "name": "John Doe", "unit": "uuid", "status": "ACTIVE" }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### 8.2 Update Student Status
- **Method**: `PATCH` | **URL**: `/api/admin/students/:id/status`
- **Body**: `{ "status": "DISABLED" }`
- **Response `200`**: `{ "data": { "id": "...", "status": "DISABLED" } }`

### 8.3 Create Skill
- **Method**: `POST` | **URL**: `/api/admin/skills`
- **Body**: `{ "name": "Machine Learning", "category": "Artificial Intelligence" }`
- **Response `201`**: `{ "data": { "id": "...", "name": "Machine Learning", "category": "Artificial Intelligence", "status": "ACTIVE" } }`

### 8.4 Update Skill
- **Method**: `PATCH` | **URL**: `/api/admin/skills/:id`
- **Body**: `{ "name": "Deep Learning", "category": "AI & Data Science" }`
- **Response `200`**: `{ "data": { "id": "...", "name": "Deep Learning", "category": "AI & Data Science", "status": "ACTIVE" } }`

### 8.5 Disable Skill
- **Method**: `DELETE` | **URL**: `/api/admin/skills/:id`
- **Response `200`**: `{ "data": { "id": "...", "status": "INACTIVE" } }`

### 8.6 Platform Statistics
- **Method**: `GET` | **URL**: `/api/admin/stats`
- **Response `200`**:
```json
{
  "data": {
    "students": { "total": 45, "active": 42 },
    "requests": { "total": 120, "accepted": 75, "pending": 30, "declined": 15 },
    "sessions": { "scheduled": 25, "completed": 50 },
    "topWantedSkills": [
      { "skill": "Python", "count": 18 },
      { "skill": "React", "count": 14 }
    ],
    "topOfferedSkills": [
      { "skill": "JavaScript", "count": 22 },
      { "skill": "Graphic Design", "count": 11 }
    ]
  }
}
```

---

## Quick Reference

| Method | Endpoint | Auth | Description |
|:---|:---|:---:|:---|
| `POST` | `/api/auth/signup` | ❌ | Register & get token |
| `POST` | `/api/auth/login` | ❌ | Login & get token |
| `GET` | `/api/profile/me` | ✅ | My profile + skills + ratings |
| `PATCH` | `/api/profile/me` | ✅ | Update my profile |
| `POST` | `/api/profile/me/skills` | ✅ | Add OFFER/WANT skill |
| `DELETE` | `/api/profile/me/skills/:id` | ✅ | Remove skill |
| **`GET`** | **`/api/users/:userId`** | **✅** | **View peer public profile** 🆕 |
| `GET` | `/api/skills` | ✅ | Skill catalog |
| `GET` | `/api/search` | ✅ | Browse peers (skillId optional) |
| `POST` | `/api/requests` | ✅ | Send swap request |
| `GET` | `/api/requests` | ✅ | List requests (email revealed if ACCEPTED) |
| `PATCH` | `/api/requests/:id` | ✅ | Accept / Decline |
| `POST` | `/api/requests/:id/session` | ✅ | Schedule session (with meeting URL) |
| `GET` | `/api/sessions` | ✅ | My sessions |
| `PATCH` | `/api/sessions/:id` | ✅ | Complete / Cancel session |
| `POST` | `/api/sessions/:id/review` | ✅ | Submit rating |
| `GET` | `/api/admin/students` | ✅ Admin | List students |
| `PATCH` | `/api/admin/students/:id/status` | ✅ Admin | Enable/disable student |
| `POST` | `/api/admin/skills` | ✅ Admin | Create skill |
| `PATCH` | `/api/admin/skills/:id` | ✅ Admin | Update skill |
| `DELETE` | `/api/admin/skills/:id` | ✅ Admin | Disable skill |
| `GET` | `/api/admin/stats` | ✅ Admin | Platform analytics |
