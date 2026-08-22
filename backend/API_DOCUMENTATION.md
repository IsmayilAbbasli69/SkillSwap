# SkillSwap API Documentation (Frontend Reference)

**Base URL**: `http://localhost:4000/api` (or configured `PORT` and `API_PREFIX`)

---

## Global Headers & Conventions

### Authentication Header
All protected endpoints require the JWT token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_access_token>
```

### Standard Response Envelope
Successful responses wrap the payload in a `data` object:
```json
{
  "data": { ... }
}
```
Paginated responses also include a `meta` object:
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Standard Error Response Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | RESOURCE_NOT_FOUND | CONFLICT | INVALID_REQUEST | INTERNAL_ERROR",
    "message": "Human readable explanation"
  }
}
```

---

## 1. Authentication (`/api/auth`)

### 1.1 Sign Up
Registers a new student account, initializes a user profile, and returns an access session token.

- **Method**: `POST`
- **URL**: `/api/auth/signup`
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "user@university.edu",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Computer Science student passionate about web development",
  "department": "Computer Science",
  "academicYear": 3,
  "institutionId": "11111111-1111-4111-8111-111111111111",
  "unitId": "22222222-2222-4222-8222-222222222222"
}
```
> `institutionId` and `unitId` are optional. If omitted, default values are assigned.

- **Response (`201 Created`)**:
```json
{
  "data": {
    "user": {
      "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
      "email": "user@university.edu"
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
Authenticates an existing user and returns an access token.

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "user@university.edu",
  "password": "password123"
}
```
- **Response (`200 OK`)**:
```json
{
  "data": {
    "user": {
      "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
      "email": "user@university.edu"
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

### 2.1 Get Current User Profile
Fetches detailed profile information for the authenticated user.

- **Method**: `GET`
- **URL**: `/api/profile/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (`200 OK`)**:
```json
{
  "data": {
    "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Computer Science student passionate about web development",
    "department": "Computer Science",
    "academicYear": 3,
    "role": "STUDENT",
    "status": "ACTIVE",
    "institution": {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "Default University"
    },
    "unit": {
      "id": "22222222-2222-4222-8222-222222222222",
      "name": "Department of Engineering"
    }
  }
}
```

---

### 2.2 Update Current User Profile
Updates editable fields on the user's profile.

- **Method**: `PATCH`
- **URL**: `/api/profile/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "bio": "Updated bio text",
  "department": "Software Engineering",
  "academicYear": 4
}
```
> All fields are optional.

- **Response (`200 OK`)**:
```json
{
  "data": {
    "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
    "firstName": "Johnny",
    "lastName": "Doe",
    "bio": "Updated bio text",
    "department": "Software Engineering",
    "academicYear": 4,
    "role": "STUDENT",
    "status": "ACTIVE",
    "institution": {
      "id": "11111111-1111-4111-8111-111111111111",
      "name": "Default University"
    },
    "unit": {
      "id": "22222222-2222-4222-8222-222222222222",
      "name": "Department of Engineering"
    }
  }
}
```

---

### 2.3 Add Skill to Profile
Adds a skill to the user profile as either an offered skill (`OFFER`) or a wanted skill (`WANT`).

- **Method**: `POST`
- **URL**: `/api/profile/me/skills`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
```json
{
  "skillId": "33333333-3333-4333-8333-333333333333",
  "type": "OFFER",
  "level": "INTERMEDIATE"
}
```
> `type`: `"OFFER"` or `"WANT"`  
> `level`: `"BEGINNER"`, `"INTERMEDIATE"`, or `"ADVANCED"`

- **Response (`201 Created`)**:
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
Deletes a skill entry from the current user's profile.

- **Method**: `DELETE`
- **URL**: `/api/profile/me/skills/:userSkillId`
- **Auth Required**: Yes (`Bearer <token>`)
- **Response (`204 No Content`)**: *(empty body)*

---

## 3. Skills Catalog (`/api/skills`)

### 3.1 List Visible Skills
Fetches the catalog of skills visible to the user's institution.

- **Method**: `GET`
- **URL**: `/api/skills`
- **Auth Required**: Yes (`Bearer <token>`)
- **Query Parameters**:
  - `search` *(optional)*: Search string to filter skill names (e.g. `?search=react`)
  - `category` *(optional)*: Filter by category (e.g. `?category=Programming`)
- **Response (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "33333333-3333-4333-8333-333333333333",
      "name": "JavaScript",
      "category": "Programming"
    },
    {
      "id": "55555555-5555-4555-8555-555555555555",
      "name": "UI/UX Design",
      "category": "Design"
    }
  ]
}
```

---

## 4. Search & Matchmaking (`/api/search`)

### 4.1 Search Students Offering a Skill
Finds student peers who offer a specific skill, ranked with a compatibility match score based on reciprocal wants and department relevance.

- **Method**: `GET`
- **URL**: `/api/search`
- **Auth Required**: Yes (`Bearer <token>`)
- **Query Parameters**:
  - `skillId` *(required, UUID)*: The skill you want to learn
  - `unitId` *(optional, UUID)*: Filter by department / unit
  - `level` *(optional)*: Minimum skill level (`"BEGINNER"`, `"INTERMEDIATE"`, `"ADVANCED"`)
  - `page` *(optional, default: 1)*: Page number
  - `limit` *(optional, default: 20)*: Number of items per page
- **Response (`200 OK`)**:
```json
{
  "data": [
    {
      "profile": {
        "id": "88888888-8888-4888-8888-888888888888",
        "name": "Sarah Connor",
        "bio": "Robotics & AI enthusiast",
        "department": "Computer Science",
        "unit": {
          "id": "22222222-2222-4222-8222-222222222222",
          "name": null
        }
      },
      "skill": {
        "id": "33333333-3333-4333-8333-333333333333",
        "name": "JavaScript",
        "level": "ADVANCED"
      },
      "match": {
        "score": 95,
        "reasons": [
          "Reciprocal skill match found",
          "Same department / institution unit"
        ]
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 5. Swap Requests (`/api/requests`)

### 5.1 Create Swap Request
Proposes a skill swap with another student.

- **Method**: `POST`
- **URL**: `/api/requests`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
```json
{
  "receiverId": "88888888-8888-4888-8888-888888888888",
  "requestedSkillId": "33333333-3333-4333-8333-333333333333",
  "offeredSkillId": "55555555-5555-4555-8555-555555555555",
  "message": "Hey! I'd love to learn JavaScript from you in exchange for Graphic Design."
}
```
> `offeredSkillId` and `message` are optional.

- **Response (`201 Created`)**:
```json
{
  "data": {
    "id": "99999999-9999-4999-8999-999999999999",
    "senderId": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
    "receiverId": "88888888-8888-4888-8888-888888888888",
    "requestedSkillId": "33333333-3333-4333-8333-333333333333",
    "offeredSkillId": "55555555-5555-4555-8555-555555555555",
    "message": "Hey! I'd love to learn JavaScript from you in exchange for Graphic Design.",
    "status": "PENDING",
    "createdAt": "2026-08-22T19:30:00.000Z"
  }
}
```

---

### 5.2 List User Swap Requests
Fetches swap requests sent or received by the authenticated user.

- **Method**: `GET`
- **URL**: `/api/requests`
- **Auth Required**: Yes (`Bearer <token>`)
- **Query Parameters**:
  - `type` *(optional)*: `"incoming"` or `"outgoing"`
  - `status` *(optional)*: `"PENDING"`, `"ACCEPTED"`, or `"DECLINED"`
- **Response (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "99999999-9999-4999-8999-999999999999",
      "status": "PENDING",
      "sender": {
        "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
        "name": "John Doe"
      },
      "receiver": {
        "id": "88888888-8888-4888-8888-888888888888",
        "name": "Sarah Connor"
      },
      "requestedSkill": {
        "id": "33333333-3333-4333-8333-333333333333",
        "name": "JavaScript"
      }
    }
  ]
}
```

---

### 5.3 Respond to Swap Request (Accept / Decline)
Receiver accepts or declines an incoming swap request.

- **Method**: `PATCH`
- **URL**: `/api/requests/:id`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
```json
{
  "status": "ACCEPTED"
}
```
> `status`: `"ACCEPTED"` or `"DECLINED"`

- **Response (`200 OK`)**:
```json
{
  "data": {
    "id": "99999999-9999-4999-8999-999999999999",
    "status": "ACCEPTED"
  }
}
```

---

### 5.4 Schedule a Session for Accepted Request
Creates and schedules a session for an accepted swap request.

- **Method**: `POST`
- **URL**: `/api/requests/:requestId/session`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
```json
{
  "scheduledAt": "2026-08-25T14:00:00.000Z",
  "duration": 60,
  "meetingType": "ONLINE"
}
```
> `duration`: Number in minutes (between 15 and 180)  
> `meetingType`: `"ONLINE"` or `"IN_PERSON"`

- **Response (`201 Created`)**:
```json
{
  "data": {
    "id": "77777777-7777-4777-8777-777777777777",
    "requestId": "99999999-9999-4999-8999-999999999999",
    "scheduledAt": "2026-08-25T14:00:00.000Z",
    "duration": 60,
    "meetingType": "ONLINE",
    "status": "SCHEDULED"
  }
}
```

---

## 6. Sessions & Reviews (`/api/sessions`)

### 6.1 List User Sessions
Fetches all scheduled, completed, or cancelled sessions the user participates in.

- **Method**: `GET`
- **URL**: `/api/sessions`
- **Auth Required**: Yes (`Bearer <token>`)
- **Query Parameters**:
  - `status` *(optional)*: `"SCHEDULED"`, `"COMPLETED"`, or `"CANCELLED"`
- **Response (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "77777777-7777-4777-8777-777777777777",
      "requestId": "99999999-9999-4999-8999-999999999999",
      "scheduledAt": "2026-08-25T14:00:00.000Z",
      "duration": 60,
      "meetingType": "ONLINE",
      "status": "SCHEDULED"
    }
  ]
}
```

---

### 6.2 Update Session Status (Complete / Cancel)
Marks a scheduled session as completed or cancelled.

- **Method**: `PATCH`
- **URL**: `/api/sessions/:id`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
```json
{
  "status": "COMPLETED"
}
```
> `status`: `"COMPLETED"` or `"CANCELLED"`

- **Response (`200 OK`)**:
```json
{
  "data": {
    "id": "77777777-7777-4777-8777-777777777777",
    "status": "COMPLETED"
  }
}
```

---

### 6.3 Submit Review for Completed Session
Submits a rating and optional feedback comment for the partner after a session is completed.

- **Method**: `POST`
- **URL**: `/api/sessions/:sessionId/review`
- **Auth Required**: Yes (`Bearer <token>`)
- **Request Body**:
```json
{
  "revieweeId": "88888888-8888-4888-8888-888888888888",
  "rating": 5,
  "comment": "Great session! Very patient teacher."
}
```
> `rating`: Integer from `1` to `5`

- **Response (`201 Created`)**:
```json
{
  "data": {
    "id": "aaaa1111-bbbb-cccc-dddd-eeeeffff0000",
    "rating": 5,
    "comment": "Great session! Very patient teacher."
  }
}
```

---

## 7. Admin (`/api/admin`) *(Role: ADMIN required)*

### 7.1 List Students
- **Method**: `GET`
- **URL**: `/api/admin/students`
- **Auth Required**: Yes (`Bearer <token>` with `role: "ADMIN"`)
- **Query Parameters**: `status`, `search`, `page`, `limit`
- **Response (`200 OK`)**:
```json
{
  "data": [
    {
      "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
      "name": "John Doe",
      "unit": "22222222-2222-4222-8222-222222222222",
      "status": "ACTIVE"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 7.2 Update Student Status
- **Method**: `PATCH`
- **URL**: `/api/admin/students/:id/status`
- **Auth Required**: Yes (`Bearer <token>` with `role: "ADMIN"`)
- **Request Body**:
```json
{
  "status": "DISABLED"
}
```
- **Response (`200 OK`)**:
```json
{
  "data": {
    "id": "6aae7059-383b-43f5-a7f6-24e57a3fcd2f",
    "status": "DISABLED"
  }
}
```

---

### 7.3 Create Institution Skill
- **Method**: `POST`
- **URL**: `/api/admin/skills`
- **Auth Required**: Yes (`Bearer <token>` with `role: "ADMIN"`)
- **Request Body**:
```json
{
  "name": "Machine Learning",
  "category": "Artificial Intelligence"
}
```
- **Response (`201 Created`)**:
```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "name": "Machine Learning",
    "category": "Artificial Intelligence",
    "status": "ACTIVE"
  }
}
```

---

### 7.4 Update Skill
- **Method**: `PATCH`
- **URL**: `/api/admin/skills/:id`
- **Auth Required**: Yes (`Bearer <token>` with `role: "ADMIN"`)
- **Request Body**:
```json
{
  "name": "Deep Learning",
  "category": "AI & Data Science"
}
```
- **Response (`200 OK`)**:
```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "name": "Deep Learning",
    "category": "AI & Data Science",
    "status": "ACTIVE"
  }
}
```

---

### 7.5 Disable Skill
- **Method**: `DELETE`
- **URL**: `/api/admin/skills/:id`
- **Auth Required**: Yes (`Bearer <token>` with `role: "ADMIN"`)
- **Response (`200 OK`)**:
```json
{
  "data": {
    "id": "33333333-3333-4333-8333-333333333333",
    "status": "INACTIVE"
  }
}
```

---

### 7.6 Get Platform Stats
- **Method**: `GET`
- **URL**: `/api/admin/stats`
- **Auth Required**: Yes (`Bearer <token>` with `role: "ADMIN"`)
- **Response (`200 OK`)**:
```json
{
  "data": {
    "students": {
      "total": 45,
      "active": 42
    },
    "requests": {
      "total": 120,
      "accepted": 75,
      "pending": 30,
      "declined": 15
    },
    "sessions": {
      "scheduled": 25,
      "completed": 50
    },
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
