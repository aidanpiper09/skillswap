# SkillSwap privileged operations (Cloud Functions)

This project uses callable Firebase Cloud Functions to protect privileged operations and generate audit logs. All of the functions below require an authenticated user, and admin-only operations additionally require the `admin: true` custom claim on the Firebase Auth token.

## Callable functions

### `logAuditEvent`
- **Purpose:** Centralized audit logging for client-triggered events without direct Firestore writes.
- **Auth:** Any signed-in user.
- **Inputs:**
  - `action` (string, required)
  - `sessionId` (string, optional)
  - `targetUserId` (string, optional)
  - `metadata` (object, optional)
- **Behavior:** Writes a server-side audit log entry with `createdAt` timestamp.

### `updateSessionStatus`
- **Purpose:** Privileged updates to session status, completion bookkeeping, and audit logging.
- **Auth:** Signed-in user who is a participant; provider-only for accept/decline.
- **Inputs:**
  - `sessionId` (string, required)
  - `status` (`accepted`, `declined`, or `completed`, required)
- **Behavior:**
  - Validates participant permissions.
  - Only accepted sessions can be completed.
  - Increments `sessionsCompleted` for participants and awards achievement milestones.
  - Logs `SESSION_ACCEPTED`, `SESSION_DECLINED`, or `SESSION_COMPLETED`.

### `submitRating`
- **Purpose:** Validates ratings, prevents duplicates, and awards 5-star achievements.
- **Auth:** Signed-in session participant.
- **Inputs:**
  - `sessionId` (string, required)
  - `score` (number 1-5, required)
  - `comment` (string, optional)
- **Behavior:**
  - Ensures session is completed and user has not rated already.
  - Writes rating document server-side.
  - Adds `five_star` achievement for 5-star ratings.
  - Logs `RATING_SUBMITTED`.

### `deleteUser`
- **Purpose:** Administrative user deletion.
- **Auth:** Admin-only.
- **Inputs:**
  - `userId` (string, required)
- **Behavior:** Removes the user from Firebase Auth and deletes their Firestore profile, then logs `USER_DELETED`.

### `createClub`
- **Purpose:** Admin-only club creation.
- **Auth:** Admin-only.
- **Inputs:**
  - `name` (string, required)
  - `description` (string, optional)
- **Behavior:** Creates a club document with the creator as the first member and logs `CLUB_CREATED`.

### `updateClubMembership`
- **Purpose:** Admin-only membership updates for clubs.
- **Auth:** Admin-only.
- **Inputs:**
  - `clubId` (string, required)
  - `memberId` (string, required)
  - `action` (`add` or `remove`, required)
- **Behavior:** Adds/removes members and logs `CLUB_MEMBER_ADDED` or `CLUB_MEMBER_REMOVED`.
