# EduPlus Data Schema (Appwrite-ready)

This document lists the collections, attributes, indexes, and permissions you can create in Appwrite to power the app. Use it as the single source of truth when setting up your backend.

## Authentication
- Enable Email/Password.
- On first sign-in, create a `profiles` document with `$id = user.$id`.

---

## Collections (Must-have)

### profiles
- id = user.$id
- role: enum [student, teacher]
- name: string
- preferredName: string?
- avatarUrl: string?
- email: string?
- createdAt: datetime
Indexes: role, email

### courses
- code: string (unique)
- name: string
- color: string?
- teacherIds: string[] (profile ids)
- gradingRule: string?
- createdAt: datetime
Indexes: code(unique), teacherIds

### enrollments
- courseId: string
- userId: string
- role: enum [student, teacher]
- status: enum [active, archived] (default active)
- joinedAt: datetime
Indexes: courseId, userId, (courseId+role), (userId+status)

### lessons (sessions)
- courseId: string
- topic: string?
- startsAt: datetime
- endsAt: datetime
Indexes: courseId, (courseId+startsAt)

### attendance_events
- courseId: string
- sessionId: string
- userId: string
- status: enum [present, late, absent, excused]
- source: enum [qr, manual]
- markedBy: string?
- markedAt: datetime
- tokenId: string?
Indexes: (sessionId+userId unique), sessionId, userId, courseId

### assessments
- courseId: string
- title: string
- type: enum [assignment, test, exam]
- dueAt: datetime
- createdAt: datetime
- status: enum [open, closed]
- rubricId: string?
Indexes: courseId, (courseId+dueAt)

### submissions
- assessmentId: string
- courseId: string
- submitterType: enum [student, group]
- submitterId: string
- content: string?
- attachments: string[] (file IDs)
- status: enum [submitted, graded, returned]
- grade: double?
- feedback: string?
- submittedAt: datetime
- gradedAt: datetime?
- gradedBy: string?
Indexes: assessmentId, (assessmentId+submitterType+submitterId unique), courseId

### groups
- courseId: string
- name: string
- createdAt: datetime
Indexes: courseId

### group_members
- groupId: string
- userId: string
- role: enum [member, lead]
- joinedAt: datetime
Indexes: groupId, userId, (groupId+userId unique)

### notes
- courseId: string
- lessonId: string?
- title: string
- body: string?
- attachments: string[]?
- visibility: enum [all, students, teachers]
- createdAt: datetime
Indexes: courseId, (courseId+lessonId)

### notifications
- userId: string
- type: enum [assignment_due, assignment_graded, announcement, resource_added]
- title: string
- subtitle: string?
- courseId: string?
- assessmentId: string?
- createdAt: datetime
- read: boolean
Indexes: userId, (userId+read)

---

## Optional (Analytics & Audit)

### activity_events
- type: string
- userId: string?
- courseId: string?
- payload: string (JSON)?
- createdAt: datetime
Indexes: type, userId, courseId, createdAt

### daily_student_stats
- userId: string
- date: string (YYYY-MM-DD)
- streakDays: int
- onTimeRate: double
- lateCount: int
- attendanceRate: double
- riskScore: int
Indexes: (userId+date unique)

---

## Optional (Chat)

### chat_threads
- courseId: string?
- title: string?
- participantIds: string[]
- createdAt: datetime
Indexes: courseId, participantIds

### chat_messages
- threadId: string
- userId: string
- text: string
- attachments: string[]?
- createdAt: datetime
- editedAt: datetime?
Indexes: threadId, (threadId+createdAt)

---

## IDs & Indexing
- Prefer ULIDs with prefixes (e.g., c-, a-, s-, ls-, att-, g-, gm-, n-, ev-, dss-).
- Use the composite indexes exactly as listed for fast queries.

## Permissions (starter)
- Start permissive: read: authenticated for general collections; restrict writes to teachers/owners.
- Submissions: submitter can create; teachers grade; read by submitter + teachers.
- Attendance: write by teachers or via secure function; student can read own events.

## Storage
- uploads (private) — submissions
- resources (public or guarded) — course materials

---

Notes:
- You can model foreign keys as plain text IDs now (fast), or switch to relationship attributes later.
- Field-level restrictions (like only teachers can set grade) should be enforced by your API layer or Appwrite Functions.
