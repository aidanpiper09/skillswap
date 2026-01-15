# Data Model (Firestore)

This document captures the conceptual model and schema used by the SkillSwap application for submission requirements.

## ERD / Conceptual Model

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : participates
  USERS ||--o{ SESSIONS : requests
  USERS ||--o{ SESSIONS : provides
  USERS ||--o{ RATINGS : gives
  USERS ||--o{ RATINGS : receives
  USERS ||--o{ MESSAGES : sends
  SESSIONS ||--o{ MESSAGES : contains
  SESSIONS ||--o{ RATINGS : has
  USERS ||--o{ AUDITLOGS : triggers
  SESSIONS ||--o{ AUDITLOGS : references
  USERS ||--o{ CLUBS : creates
  USERS ||--o{ CLUBS : joins

  USERS {
    string id PK
    string name
    string email
    string role
    string gradYear
    timestamp createdAt
    string bio
    array offeredSkills
    array soughtSkills
    array achievements
    number sessionsCompleted
  }

  SESSIONS {
    string id PK
    string requesterId FK
    string requesterName
    string providerId FK
    string providerName
    string skill
    timestamp startTime
    string location
    string status
    array participants
    timestamp createdAt
  }

  RATINGS {
    string id PK
    string sessionId FK
    string raterId FK
    string rateeId FK
    number score
    string comment
    timestamp createdAt
  }

  MESSAGES {
    string id PK
    string sessionId FK
    string fromUserId FK
    string fromName
    string body
    timestamp createdAt
  }

  CLUBS {
    string id PK
    string name
    string description
    string createdByUserId FK
    array memberIds
    array tags
    timestamp createdAt
  }

  AUDITLOGS {
    string id PK
    string action
    string userId FK
    string sessionId FK
    string targetUserId FK
    timestamp timestamp
  }
```

> Note: The Firestore SDK provides document IDs as primary keys. Foreign keys are logical references enforced in application logic rather than database-level constraints.

---

## Collection Schemas

### `users`

**Purpose:** Profile and role data for authenticated users.

| Field | Type | Required | Notes / Constraints |
| --- | --- | --- | --- |
| `name` | string | yes | Display name used across UI. |
| `email` | string | yes | Auth email; unique per Firebase Auth user. |
| `role` | string | yes | Enum: `student`, `admin`. |
| `gradYear` | string | yes | Stored as string in UI (e.g., `"2026"`). |
| `createdAt` | timestamp | yes | Set on registration. |
| `bio` | string | no | Optional profile bio. |
| `offeredSkills` | array<object> | no | Each item: `{ name: string, proficiency: "beginner"|"intermediate"|"advanced" }`. |
| `soughtSkills` | array<object> | no | Each item: `{ name: string, interest: "low"|"medium"|"high" }`. |
| `achievements` | array<string> | no | Achievement IDs (`first_session`, `five_sessions`, `ten_sessions`, `five_star`, etc.). |
| `sessionsCompleted` | number | no | Incremented when a session is marked `completed`. |

**Indexes:**
- Default single-field indexes.
- No composite indexes required by current queries.

---

### `sessions`

**Purpose:** Skill swap requests and scheduled sessions.

| Field | Type | Required | Notes / Constraints |
| --- | --- | --- | --- |
| `requesterId` | string | yes | FK to `users` (requesting student). |
| `requesterName` | string | yes | Cached name for UI convenience. |
| `providerId` | string | yes | FK to `users` (providing student). |
| `providerName` | string | yes | Cached name for UI convenience. |
| `skill` | string | yes | Skill topic for the session. |
| `startTime` | timestamp | yes | Scheduled time. |
| `location` | string | no | Optional location text. |
| `status` | string | yes | Enum: `pending`, `accepted`, `completed`, `rejected`. |
| `participants` | array<string> | yes | Contains both user IDs for quick lookup. |
| `createdAt` | timestamp | yes | Created when requested. |

**Indexes:**
- Single-field index on `participants` (array-contains query).
- Optional composite index on `participants` + `status` if filtering by status is added.

---

### `ratings`

**Purpose:** Post-session feedback between participants.

| Field | Type | Required | Notes / Constraints |
| --- | --- | --- | --- |
| `sessionId` | string | yes | FK to `sessions`. One or two ratings per session depending on UX rules. |
| `raterId` | string | yes | FK to `users`. |
| `rateeId` | string | yes | FK to `users`. |
| `score` | number | yes | 1–5 integer. |
| `comment` | string | no | Optional rating text. |
| `createdAt` | timestamp | yes | Time of submission. |

**Indexes:**
- Single-field index on `sessionId` if filtering by session is needed.

---

### `messages`

**Purpose:** Session-specific chat messages.

| Field | Type | Required | Notes / Constraints |
| --- | --- | --- | --- |
| `sessionId` | string | yes | FK to `sessions`. |
| `fromUserId` | string | yes | FK to `users`. |
| `fromName` | string | yes | Cached sender name for UI. |
| `body` | string | yes | Message text. |
| `createdAt` | timestamp | yes | Message timestamp. |

**Indexes:**
- Composite index on `sessionId` (==) + `createdAt` (asc) for ordered session messages.

---

### `clubs`

**Purpose:** Optional student clubs (conceptual model; not yet surfaced in UI).

| Field | Type | Required | Notes / Constraints |
| --- | --- | --- | --- |
| `name` | string | yes | Club display name (unique within organization). |
| `description` | string | no | Club overview and mission. |
| `createdByUserId` | string | yes | FK to `users`. |
| `memberIds` | array<string> | no | User IDs for membership. |
| `tags` | array<string> | no | Skill or topic tags for discovery. |
| `createdAt` | timestamp | yes | Club creation date. |

**Indexes:**
- Single-field index on `memberIds` (array-contains) if filtering by membership is added.
- Optional composite index on `tags` + `createdAt` for discovery views.

---

### `auditLogs`

**Purpose:** Administrative audit trail of system actions.

| Field | Type | Required | Notes / Constraints |
| --- | --- | --- | --- |
| `action` | string | yes | Enum-like string (e.g., `USER_REGISTERED`, `SESSION_REQUESTED`, `USER_DELETED`). |
| `userId` | string | yes | Actor user ID. |
| `sessionId` | string | no | FK to `sessions` when applicable. |
| `targetUserId` | string | no | FK to `users` for admin actions. |
| `timestamp` | timestamp | yes | Log time. |

**Indexes:**
- Single-field index on `timestamp` for admin ordering (desc).

---

## Relationship Summary

- `users` ↔ `sessions`: `sessions.requesterId` and `sessions.providerId` link to `users.id`.
- `sessions` ↔ `messages`: `messages.sessionId` groups chat by session.
- `sessions` ↔ `ratings`: `ratings.sessionId` links feedback to a session.
- `users` ↔ `ratings`: `ratings.raterId` and `ratings.rateeId` link to `users.id`.
- `users` ↔ `auditLogs`: `auditLogs.userId` is the actor; `targetUserId` is the affected user.
- `clubs` ↔ `users`: `clubs.createdByUserId` and `clubs.memberIds` link to `users.id`.
