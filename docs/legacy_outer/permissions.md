# Appwrite permissions: what to set now vs later

This guide shows exactly what to click in the Console today and what is set at runtime by the app. No placeholders are used in the Console; user/team specific permissions are assigned per document in code after users exist.

## Key rules
- Turn ON Document‑level Security for every collection.
- In the Console, only set the collection‑level Create permission when students create those docs from the app. Leave Read/Update/Delete empty at the collection level.
- Per‑user or per‑team permissions (e.g., user:abc, team:xyz) are set per document in code when the document is created or updated.
- Do not enter placeholders like `user:{id}` in the Console. The braces were only documentation placeholders.

## Console checklist (do this now)
For each collection below, set Document‑level Security = ON and set only the “Create” toggle where indicated. Everything else is set at runtime.

- profiles
  - Create: none (created by server/function on first login)
- courses
  - Create: none (teachers/function only)
- enrollments
  - Create: All users (students can request/join)
- lessons (sessions)
  - Create: none (teachers/function)
- attendance_events
  - Create: none (created by teacher/function during QR flow)
- assessments
  - Create: none (teachers/function)
- submissions
  - Create: All users (students submit from app)
- groups
  - Create: none (teachers/function)
- group_members
  - Create: All users (students can join/leave when enabled)
- notes (personal)
  - Create: All users (personal notes)
- notifications
  - Create: none (server/function)
- activity_events (audit)
  - Create: none (server/function)
- daily_student_stats (analytics)
  - Create: none (server/function)

Tip: Avoid “Any” or “All guests” for school data.

## What is set later (runtime, per document)
When creating a document, the app supplies permissions that reference real IDs. Examples:

- user:{accountId} → Appwrite Account $id (from `account.get().$id`)
- team:{teamId} → Appwrite Team $id (from Teams.create or Console)

### Typical per‑document permissions
- profiles
  - user:{ownerAccountId} read, update
- courses
  - team:{staffTeamId} read, update, delete
  - team:{membersTeamId} read
- enrollments
  - user:{studentAccountId} read
  - team:{staffTeamId} read, update, delete
- lessons (sessions)
  - team:{staffTeamId} read, update, delete
  - team:{membersTeamId} read
- attendance_events
  - user:{studentAccountId} read
  - team:{staffTeamId} read, update, delete
- assessments
  - team:{staffTeamId} read, update, delete
  - team:{membersTeamId} read
- submissions
  - user:{studentAccountId} read, update (app locks edits after submit)
  - team:{staffTeamId} read, update, delete
- groups
  - team:{staffTeamId} read, update, delete
  - team:{membersTeamId} read
- group_members
  - user:{studentAccountId} read, delete (self‑leave)
  - team:{staffTeamId} read, update, delete
- notes (personal)
  - user:{authorAccountId} read, update, delete
- notifications
  - user:{recipientAccountId} read
- activity_events (audit)
  - team:{staffTeamId} read (no update/delete—append‑only)
- daily_student_stats (analytics)
  - team:{staffTeamId} read
  - user:{studentAccountId} read

## Where to get IDs
- Account ID (`user:{id}`): after login, `account.get().$id` (client) or via Users API (server).
- Team ID (`team:{id}`): create with Teams API or in Console; store on the related course document (e.g., `staffTeamId`, `membersTeamId`).

## Code snippets (TypeScript)
Create a document with per‑document permissions:

```ts
import { Client, Databases, ID, Permission, Role } from 'appwrite';

const db = new Databases(new Client().setProject(PROJECT_ID));

await db.createDocument(
  DB_ID,
  'attendance_events',
  ID.unique(),
  { courseId, sessionId, studentAccountId, status: 'present' },
  [
    Permission.read(Role.user(studentAccountId)),
    Permission.read(Role.team(staffTeamId)),
    Permission.update(Role.team(staffTeamId)),
    Permission.delete(Role.team(staffTeamId)),
  ]
);
```

Optional: create per‑course teams when a teacher creates a course:

```ts
import { Teams, ID } from 'appwrite';

const teams = new Teams(client);
const staffTeamId = ID.unique();
const membersTeamId = ID.unique();
await teams.create(staffTeamId, `cstf_${shortSlug}`); // <= 36 chars
await teams.create(membersTeamId, `cmem_${shortSlug}`);
// store these IDs on the course doc and reuse for permissions
```

## Dev‑mode shortcut (optional)
If you just need to unblock early screens:
- Temporarily set collection‑level Read = All users on non‑sensitive collections.
- Keep Document‑level Security ON.
- Remove the broad Read when moving to production and rely on per‑document permissions.

## Production hardening checklist
- No collection uses “Any” or “All guests”.
- Only submissions, group_members, notes allow Create by All users.
- All other documents created via trusted path (teacher or server function) with explicit per‑document permissions.
- Team IDs are short and stored on the course document.

## Utilities (repo scripts)
- Backfill user-specific teacher permissions on courses (uses teacherIds on each course):
  - npm run grant:course-perms
  - Requires: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID in .env
- Grant a single Team update/delete across all courses (e.g., a global Teachers team):
  - npm run grant:course-team-perms
  - Requires: APPWRITE_* above plus TEAM_ID (or APPWRITE_TEAM_TEACHERS_ID)
