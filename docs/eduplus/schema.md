# EduPlus – Database blueprint (Appwrite)

This is the authoritative schema we target in Appwrite Database. It aligns with the current app code and anticipates future features. It’s split into “now” (MVP) and “later” (planned). Roles: student, teacher, admin.

Important: Do NOT store credentials in your own collections. Never add password or passwordHash to a “users” table. Appwrite Auth owns credentials; we only keep a lightweight profile document per account.

## MVP collections (implemented in code today)

These IDs are used by the app and by `scripts/init-schema.js`/`scripts/seed-appwrite.js`.

1) profiles (document id = Appwrite account $id)
- name (string, required)
- email (string, required, unique index)
- role (enum: student|teacher|admin, required, default student)
- avatarUrl (string, optional)
- lastLogin (datetime, optional)
Indexes: email (unique)
Permissions: users read; document-level write restricted to owner and admins (set via server as needed).

2) courses
- code (string, required, unique)
- title (string, required)
- teacherId (string, required) – references profiles/$id
Indexes: code (unique), teacherId (key)
Permissions: students enrolled can read; teacher/admin write (enforced by server-side rules where appropriate).

3) assignments
- courseId (string, required)
- title (string, required)
- dueAt (datetime, required)
- createdAt (datetime, default now)
- description (string, optional)
Indexes: courseId (key), dueAt (key)

4) groups
- assignmentId (string, required)
- name (string, required)
Indexes: assignmentId (key)

5) progress_nodes (tree for group project progress)
- groupId (string, required)
- title (string, required)
- percent (float, 0..100, required, default 0)
- parentId (string, optional)
Indexes: groupId (key), parentId (key)

6) messages (group chat)
- groupId (string, required)
- userId (string, required) – author
- text (string, required)
- createdAt (datetime, required)
Indexes: (groupId, createdAt) for fast timeline queries

Storage buckets (MVP)
- avatars (optional, public-read) – profile images
- attachments (optional, auth-read) – chat files

## Near-term collections (nice-to-have, planned)

7) enrollments (junction, course ↔ user)
- courseId (string, required)
- userId (string, required)
- role (enum: student|ta|teacher, default student)
Indexes: (courseId, userId) unique, courseId (key), userId (key)

8) submissions
- assignmentId (string, required)
- userId (string, optional for group work)
- groupId (string, optional for group work)
- fileId (string, optional) – storage reference
- status (enum: draft|submitted|graded, default draft)
- submittedAt (datetime, optional)
Indexes: assignmentId (key), userId (key), groupId (key)

9) threads (for broader inbox beyond group chat)
- type (enum: course|group|dm)
- courseId (string)
- groupId (string)
- memberIds (string[])
- title (string)
Indexes: courseId (key), groupId (key)

10) section_tasks (hierarchical checklist per assignment section)
- assignmentId (string, required)
- sectionKey (string, required)
- parentId (string, optional)
- title (string, required)
- done (boolean, default false)
- order (number, default 0)
- path (string[], required)  // ancestor ids from root to this node for fast reads
- depth (number, optional)   // denormalized for UI
- createdAt, updatedAt (datetime)
Indexes: (assignmentId, sectionKey), (assignmentId, sectionKey, parentId)
Permissions: students on that assignment can read/write their own tasks; teachers read and optionally write for oversight.

## Permissions model (practical guide)
- Prefer document-level permissions; attribute-level ACLs are not available.
- Profiles: owner read/write; admins full; teachers read students they teach (enforced via backend or rules when possible).
- Courses/Assignments: read for enrolled users; write for teacher/admin.
- Groups/Messages/Progress: members and teacher can read; author or teacher can write.
- Storage: avatars can be public-read; submissions/attachments must be auth-read.

Role handling & route guards
- Profiles.role determines which tab group mounts (student vs teacher). Store role in session state after sign-in and guard routes accordingly.
- Teacher-only actions (e.g., create assignment) are hidden in UI and enforced in backend permissions.

## Indexing tips
- Always index foreign keys you filter on: courseId, teacherId, assignmentId, groupId, userId.
- Create a composite index for time-ordered feeds per scope, e.g., (groupId, createdAt).
- Use unique indexes for natural keys like course code, email.
 - For hierarchical tasks, index (assignmentId, sectionKey, parentId) and consider a path prefix strategy if deeply nested queries are needed.

## Why no passwordHash column?
Appwrite Auth manages credentials securely. Storing password hashes in a custom collection is redundant and risky. Use the built-in Users + Sessions APIs and keep only profile metadata in `profiles`.

## How schema is created
- Option A: Use Appwrite Console to add a Database and the above collections/attributes.
- Option B: Run the helper script: `npm run init:schema` in `eduplus/`. It will try to create the database/collections with sensible default IDs if they’re not provided and print them out. Then run `npm run seed` to populate demo data.

## Evolution notes
- If you later introduce enrollments, migrate permissions from array attributes to the junction table and adapt queries.
- For analytics, consider an `events` stream and periodic rollups into cached documents for teacher dashboards.
- For the progress tree, keep writes small and debounce UI updates; deep trees benefit from client-side caching and optimistic updates.
