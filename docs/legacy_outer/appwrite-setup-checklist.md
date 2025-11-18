# Appwrite Setup Checklist (EduPlus)

Follow this step-by-step sequence to provision all required collections, indexes, and buckets.

## Prerequisites
- Appwrite project created (e.g., project: `eduplus`)
- Admin API key ready (for scripting) OR access to Console
- Decide database name (use: `eduplus`)

## 1. Enable Auth
1. In Authentication → Providers: enable Email/Password.
2. (Optional) Disable self-registration if only teachers/admins can invite.
3. Plan: After user creation, client creates a `profiles` document where doc `$id = user.$id`.

## 2. Create Buckets
- `uploads` (private): for submissions and student-uploaded assets.
- `resources` (public or restricted): for notes and course materials.

## 3. Create Database
- Name: `eduplus`

## 4. Collections (Order Matters)
Create in order to avoid referencing gaps.
1. profiles
2. courses
3. enrollments
4. lessons
5. attendance_events
6. assessments
7. submissions
8. groups
9. group_members
10. notes
11. notifications
12. (optional) activity_events
13. (optional) daily_student_stats
14. (optional chat) chat_threads
15. (optional chat) chat_messages

## 5. Attributes & Indexes Summary
See `schema.md` for full attribute descriptions. Below is a compressed reminder.

| Collection | Key Attributes | Composite Indexes |
|------------|----------------|-------------------|
| profiles | role, name, preferredName | email(optional) |
| courses | code(unique), teacherIds | code(unique) |
| enrollments | courseId, userId, role, status | (courseId+role), (userId+status) |
| lessons | courseId, startsAt | (courseId+startsAt) |
| attendance_events | sessionId, userId, status | (sessionId+userId unique) |
| assessments | courseId, dueAt | (courseId+dueAt) |
| submissions | assessmentId, submitterType, submitterId | (assessmentId+submitterType+submitterId unique) |
| groups | courseId, name | — |
| group_members | groupId, userId, role | (groupId+userId unique) |
| notes | courseId, lessonId | (courseId+lessonId) |
| notifications | userId, read | (userId+read) |
| activity_events | type, userId, courseId | — |
| daily_student_stats | userId, date | (userId+date unique) |
| chat_threads | participantIds | — |
| chat_messages | threadId, createdAt | (threadId+createdAt) |

## 6. Starter Permissions (Adjust Later)
- profiles: read (authenticated), write (owner self) for avatar/preferredName.
- courses: read (authenticated), write (teacher owner). 
- enrollments: write (teacher); restrict read to teachers + owner.
- assessments/submissions: read (enrolled); submissions write by submitter; grading fields by teacher.
- attendance_events: write (teacher/function); read teacher + owning student.
- groups/group_members: write (teacher); read (group members + teachers or enrolled).
- notes: visibility based filtering.
- notifications: read/write (user), create by system function.

## 7. Scripted Provision (Optional)
A Node script template is provided in `scripts/appwrite/provision.ts`.
Run after setting environment variables:
```
APPWRITE_ENDPOINT=https://YOUR-ENDPOINT \
APPWRITE_PROJECT=YOUR_PROJECT_ID \
APPWRITE_API_KEY=YOUR_API_KEY \
node scripts/appwrite/provision.ts
```

## 8. Post-Creation Verification
- Create one teacher profile (role=teacher) manually.
- Seed one course + enrollments.
- Add one assessment + submission.
- Generate one lesson + attendance event.
- Confirm indexes allow fast queries (e.g., filter submissions by assessment quickly).

## 9. Hybrid Mode
- Keep mock services until confident with live backend.
- Gradually replace calls: try read-through (if live fails, fallback to mock).

## 10. Future Enhancements
- Add rubric collection when grading expands.
- Add task/engagement collections if effort tracking becomes separate.

Refer back to `schema.md` for full definitions before adding new attributes. Keep both files synchronized.
