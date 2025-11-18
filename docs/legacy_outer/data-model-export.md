# EduPlus Data Model Export (Copy-Friendly)

> Version: FYP baseline – November 8, 2025  
> Scope: Auth, roster, assignments, submissions, chat, groups, attendance, analytics (effort vs grade separation)  
> This document is intentionally flattened and skimmable so you can copy sections into slides, proposals, or Appwrite collection setups.

---
## 1. Minimal Required Schema (Current App Flows)
Absolute essentials to run: sign in, show course roster, list assignments, submit work, basic chat.

### Users / Auth
- id (string, Appwrite userId) – PK
- email (unique)
- passwordHash (server only; never returned)
- role ("student" | "teacher")
- status ("active" | "disabled")

### Profiles (`profiles` collection)
- id (string) – PK (same as userId or separate docId)
- userId (FK → users)
- fullName
- preferredName (optional)
- pronouns (optional)
- avatarUrl (optional)
- cohortId (FK) – optional for now

### Courses (`courses`)
- id – PK
- title
- code (unique within tenant) (e.g., MATH101)
- teacherUserId (FK → users)
- gradingRule (60 coursework / 40 exams) – JSON or structured fields

### Enrollments (`enrollments`)
- id – PK
- courseId (FK)
- userId (FK)
- roleInCourse ("student" | "teacher-assistant" | "teacher") – for flexibility
- createdAt

### Assessments (`assessments`)
Unified assignments/tests/exams/quiz/reflection.
- id – PK
- courseId (FK)
- type ("assignment" | "test" | "exam" | "quiz" | "reflection")
- title
- description (optional)
- dueAt (nullable for exams)
- weightComponent ("coursework" | "exam")
- maxScore
- mode ("individual" | "group")
- groupCriteria (optional JSON)
- createdBy (teacher userId)
- releasedAt (schedule control)

### Submissions (`submissions`)
- id – PK
- assessmentId (FK)
- studentUserId OR groupId (one populated)
- submittedAt
- status ("draft" | "submitted" | "graded" | "late")
- grade (numeric, nullable until graded)
- feedback (text, optional)
- artifacts (array: file refs / URLs / objects)
- isOnTime (derived; store boolean for analytics caching)

### Threads (`threads` for course / assessment / group)
- id – PK
- contextType ("course" | "assessment" | "group")
- contextId (FK)
- createdBy
- title (optional)
- lastMessageAt (for sorting)

### Messages (`messages`)
- id – PK
- threadId (FK)
- senderUserId
- content (text)
- createdAt
- editedAt (optional)
- replyToMessageId (optional)

### Groups (`groups`)
- id – PK
- courseId (FK)
- name
- formedAt
- formedBy (teacherUserId)

### Group Members (`group_members`)
- id – PK
- groupId (FK)
- userId (FK)
- roleInGroup ("member" | "leader")
- joinedAt

### Minimum Attendance (optional early)
If not implemented yet, ignore. When added: `attendance_events` with (id, courseId, userId, sessionId, status, timestamp).

---
## 1.1 Teacher model & permissions (light admin)

Teacher identity lives in the same core structures; “light admin” refers to per-course administrative powers, not global tenant control.

### Teacher identity fields
- users.role = "teacher"
- users.isAdmin = false by default (true only for platform/tenant admins)
- profiles.teacher (optional object)
	- subjectTags: string[]
	- officeHours: array<{ dayOfWeek: 0-6, start: "HH:MM", end: "HH:MM" }>
	- bio?: string
	- contactEmail?: string (can mirror user email)
	- contactPhone?: string
- courses.teacherUserId → single-owner shortcut; OR rely on enrollments for multi-teacher
- enrollments.roleInCourse in { "teacher", "teacher-assistant", "student" }

### Per-course permissions (derived)
Derived from (users.role, course ownership, enrollments.roleInCourse):
- Course settings (title, code, gradingRule): owner teacher
- Roster management (add/remove enrollments): teacher
- Assessments (create/update/delete, releasedAt, due overrides, rubrics): teacher/TA
- Submissions (grade, regrade): teacher/TA; release grades: teacher
- Groups (create, assign members, switch assessment mode to group): teacher
- Attendance (mark, edit until cutoff): teacher/TA
- Threads/messages (pin, delete, close): teacher/TA
- Progress nodes (official engagement tree): teacher
- Notifications (send to course members): teacher
- Analytics dashboards (view): teacher

Not included for light admin (require full admin):
- Manage other teachers’ accounts or roles
- Change tenant-wide settings or system collections
- Access courses without enrollment/ownership
- Access passwords (may trigger password-reset email only)

### Representation options
- Derived (recommended): compute privileges at runtime; avoid storing per-user flags.
- Enrollment-scoped capabilities (optional):
	- enrollments.capabilities?: string[] (e.g., ["manage_roster", "grade", "release_grades"]).

### Suggested explicit fields (if needed)
- users.isAdmin: boolean (default false)
- profiles.teacher: object with subjectTags, officeHours, etc.
- enrollments.roleInCourse: "teacher" | "teacher-assistant" | "student"
- enrollments.capabilities?: string[] (fine-grained overrides)

### Example (condensed)
```
user: {
	id: "usr_01H...", email: "teacher@school.my", role: "teacher", status: "active", isAdmin: false
}
profile: {
	id: "pro_01H...", userId: "usr_01H...", fullName: "Pn. Nor Aisyah",
	preferredName: "Pn. Aisyah",
	teacher: {
		subjectTags: ["Mathematics", "Add Maths"],
		officeHours: [{ dayOfWeek: 2, start: "15:00", end: "17:00" }]
	}
}
course: { id: "crs_math101", title: "Mathematics 101", teacherUserId: "usr_01H..." }
enrollment: { id: "enr_01H...", courseId: "crs_math101", userId: "usr_01H...", roleInCourse: "teacher" }
```

---
## 1.2 Teacher capability matrix (CRUD & dataset effects)

Below records what teachers (light admins) can CREATE/UPDATE/DELETE and how each action mutates data, including side-effects. TA (teacher-assistant) inherits a subset (grading, attendance, moderation), configurable via enrollments.capabilities.

### Courses
- Create: courses{ id, title, code, teacherUserId, gradingRule, createdAt, createdBy }
	- Side effects: auto-enroll creator as enrollments{ roleInCourse: "teacher" }.
	- Optional: bootstrap default thread ("General") and analytics placeholders.
- Update: title, gradingRule, teacherUserId (transfer ownership)
	- Side effects: if gradingRule changes, recompute coursework/exam aggregates; emit activity_events("course_rule_changed").
- Delete/Archive: prefer courses.isArchived = true
	- Side effects: cascade archive to assessments, threads; block if active lessons today; preserve submissions.

### Roster (Enrollments)
- Add student/TA: create enrollments{ courseId, userId, roleInCourse, createdBy }
	- Side effects: notify user; grant access to course resources.
- Remove student/TA: soft delete or set enrollments.isActive = false
	- Side effects: revoke access; DO NOT delete historical submissions or messages; keep for audit.

### Assessments
- Create: assessments{ id, courseId, type, title, dueAt, weightComponent, mode, releasedAt?, createdBy, status: "draft"|"scheduled"|"released"|"closed" }
	- Side effects: optional thread per assessment; schedule due reminders; index for course view.
- Update: title/desc/dueAt/mode/releasedAt/status
	- Side effects: dueAt change triggers isOnTime recompute candidates; releasedAt toggles visibility and opens submissions.
- Delete/Archive:
	- Allowed hard-delete only if status="draft" and no submissions.
	- Otherwise set assessments.isArchived = true; hide from student view; keep in gradebook history.

### Submissions & Grading
- Grade / Regrade: update submissions{ grade, feedback, status: "graded", gradedAt, gradedBy }
	- Side effects: append submissions.gradeHistory[]; recalc student coursework/exam aggregates; notify student(s); for group mode, propagate identical grade to group members.
- Allow resubmission window: assessment.status remains "released"; teacher may reset submissions.status to "draft" for specific student/group.

### Groups
- Create: groups{ id, courseId, name, formedAt, formedBy }
- Manage membership: group_members add/remove with roleInGroup
	- Side effects: future group submissions will use current membership; existing submissions keep submissions.membersSnapshot for history.
- Delete: only if no group submissions exist; otherwise set groups.isArchived = true.

### Attendance
- Mark: attendance_events{ courseId, sessionId, userId, status, markedAt, markedBy }
	- Side effects: update daily_student_stats (attendanceRate, streaks) in next aggregation.
- Edit window: allow changes until cutoff (e.g., 24h); all edits logged in activity_events.

### Threads & Messages (Moderation)
- Create thread: threads{ contextType, contextId, createdBy }
- Moderate message: messages.isDeleted = true or contentEdited; record messages.editedAt/editedBy
	- Side effects: activity_events("message_deleted"|"message_edited"); update thread.lastMessageAt if needed.

### Progress (Engagement)
- Create official nodes: progress_nodes{ countsTowardEffort: true, createdBy }
- Update node titles/order/active flag
- Delete: prefer deactivate (active=false) to keep historical node_state valid.

### Notifications
- Send course notifications: notifications{ userId, type, contextType, contextId, createdAt }
	- Typical triggers: assessment released, due soon, grade released.

### Lessons / Sessions
- Create lesson: lessons{ courseId, startsAt, endsAt, topic }
- Update/cancel: lessons.isCancelled = true (preserve for audit); cascade cancel pending attendance reminders.

Permission nuance (suggested defaults):
- Teacher: all above for owned/enrolled courses.
- TA: grade, manage attendance, moderate threads, create assessments (optional), cannot change gradingRule or transfer ownership unless capability granted.

---
## 1.3 Dataset mutation & audit rules

To keep implementation simple and safe later, adopt these cross-cutting rules now:

### Common system fields
- createdAt, createdBy, updatedAt, updatedBy on all mutable collections.
- isArchived or isActive for soft-deletes (courses, assessments, groups, enrollments, threads, messages).
- version (int) optional for optimistic concurrency.

### Audit trails
- activity_events append-only with event types:
	- course_created/updated/archived, roster_added/removed
	- assessment_created/updated/released/archived
	- submission_graded/regraded/reset
	- group_created/membership_changed/archived
	- attendance_marked/edited
	- thread_created/message_edited/message_deleted
	- node_created/node_deactivated
	- notification_sent

### Grade history
- submissions.gradeHistory: [{ grade, feedback?, gradedAt, gradedBy, reason? }]
- Keep latest in submissions.grade for fast reads; rely on history for audit/regress.

### Release workflow states
- assessments.status transitions:
	- draft → scheduled (optional) → released → closed/archived
	- Constraints: delete only in draft (no submissions). Editing dueAt after released triggers on-time recompute window.

### Cascades & integrity
- Archiving a course sets children isArchived=true (assessments, threads, groups); do not touch submissions.
- Removing enrollment does not delete submissions/messages; access gated by active enrollment.
- Group membership changes do not rewrite past submissions; rely on submissions.membersSnapshot.

### Recomputations
- Changes to gradingRule, assessment weightComponent, or submission grades enqueue recomputation of:
	- per-assessment ranks (optional)
	- coursework/exam aggregates per student
	- daily_student_stats deltas (tasksCompleted/onTimeRate) where applicable

These policies ensure teacher edits are reversible, auditable, and won’t corrupt historical analytics.

---
## 2. Extended / Planned Collections (Analytics & Engagement)
Add when you need deeper insights.

### Progress Nodes (`progress_nodes`)
Hierarchical engagement tasks (not graded). Teacher created.
- id
- courseId
- parentNodeId (nullable)
- title
- type ("topic" | "unit" | "task" | "subtask")
- orderIndex
- active (bool) – allow retire without deletion

### Node State (`node_state`)
Per student or group completion markers.
- id
- nodeId (FK)
- userId OR groupId
- completedAt (nullable)
- status ("pending" | "in-progress" | "completed")
- source ("teacher" | "student" | "auto") – governance hook

### Activity Events (`activity_events`)
Append-only raw actions for analytics.
- id
- actorUserId
- courseId (nullable – some global events)
- type ("view_assessment" | "open_message" | "submit" | "complete_node" | "login" | ...)
- refType/refId (e.g., assessment, node, submission)
- at (timestamp)
- meta (JSON)

### Daily Student Stats (`daily_student_stats`)
Materialized per (userId, date, courseId).
- id
- date (YYYY-MM-DD)
- userId
- courseId
- minutesActive (int)
- tasksCompleted (int)
- onTimeRate (float) – cumulative or day slice
- overdueCount (int)
- streakDays (int)
- riskScore (float, derived)
- computedAt

### Attendance Events (`attendance_events`)
- id
- courseId
- sessionId (FK → lessons/sessions)
- userId
- status ("present" | "late" | "absent" | "excused")
- markedAt
- markedBy

### Lessons (`lessons`)
- id
- courseId
- startsAt
- endsAt
- topic
- sequenceIndex

### Reflections (Handled as assessment type "reflection")
No separate collection unless future branching.

### Notifications (`notifications`)
- id
- userId
- type ("grade_released" | "due_tomorrow" | ...)
- contextType/contextId
- createdAt
- readAt (nullable)

---
## 3. Task Governance & Anti-Abuse (Planned)
Goal: Prevent students from inflating engagement.

Approach:
- Only teacher-created progress nodes counted for official effort metrics.
- student-created tasks kept in a separate tree `personal_nodes` or flagged with source="student" excluded from streak / risk calculations.
- Validation: node_state write API checks node.source != "student" before incrementing official counters.
- Audit: activity_events captures both but analytics pipeline filters by source.

Future Fields:
- progress_nodes.countsTowardEffort (bool, default true for teacher nodes)
- node_state.validationReason (optional text if rejected)

---
## 4. Effort vs Grade Contract
Effort metrics come from:
- node_state completions
- activity_events density + minutes inferred
Grades come only from:
- submissions.grade linked to assessments.weightComponent
Teacher Dashboards:
1. Roster At-a-Glance: onTime %, overdue count, streak, riskScore
2. Effort vs Grade Scatter: current coursework grade vs tasksCompleted/week
3. Group Contribution: group submission status + individual activity delta
4. Attendance Impact: attendance rate vs onTime rate

No direct conversion of tasks -> grade; tasks are engagement boosters and early risk signals.

---
## 5. Group Workflow Summary
1. Formation: teacher creates groups, assigns members.
2. Assignment Mode=group: one submission per groupId; after grade release all members get same grade.
3. Effort Tracking: node_state can store group-level completions; individual members still generate activity_events.
4. Late Handling: group submission late → all members considered late for that assessment.
5. Edge Cases: member leaves group after submission – submission remains tied; historical reporting uses membership snapshot stored in submission meta.

Recommended Extra Field:
- submissions.membersSnapshot (array<userId>)

---
## 6. Index Strategy (Suggested Appwrite / DB Indexes)
Unique:
- users.email
- courses.code
Composite / Query Acceleration:
- enrollments: (courseId, roleInCourse)
- assessments: (courseId, releasedAt)
- submissions: (assessmentId, studentUserId) and (assessmentId, groupId)
- activity_events: (actorUserId, at DESC)
- node_state: (userId, nodeId)
- daily_student_stats: (userId, date) and (courseId, date)
- attendance_events: (courseId, sessionId, userId)

Analytics Batch:
- daily_student_stats.riskScore (range queries)

---
## 7. ID Patterns
Format: short prefixed ULIDs (time sortable, collision resistant):
- usr_xxxxx  (User)
- pro_xxxxx  (Profile)
- crs_xxxxx  (Course)
- enr_xxxxx  (Enrollment)
- asm_xxxxx  (Assessment)
- sub_xxxxx  (Submission)
- grp_xxxxx  (Group)
- gmb_xxxxx  (Group Member)
- nod_xxxxx  (Progress Node)
- nst_xxxxx  (Node State)
- act_xxxxx  (Activity Event)
- dss_xxxxx  (Daily Stat)
- att_xxxxx  (Attendance Event)
- les_xxxxx  (Lesson)
- thr_xxxxx  (Thread)
- msg_xxxxx  (Message)
- not_xxxxx  (Notification)

---
## 8. Privacy & PII
PII Fields: email, fullName, preferredName, avatarUrl (if face), any freeform reflection content.
Mitigations:
- Limit reflection length; optional sentiment classification stored, not original text in analytics pipeline.
- Anonymize analytics exports: replace userId with hashed pseudonym keyed by export batch.
- Retention: raw activity_events older than 180 days aggregated then pruned.

---
## 9. Migration Guidance (From Minimal → Extended)
1. Introduce new collections incrementally; existing code keeps using profiles/enrollments.
2. Add progress_nodes + node_state: feature flag the UI; default off.
3. Add activity_events write calls inside existing submission & assessment view handlers (non-breaking).
4. Backfill daily_student_stats nightly via script with historical events.
5. Create new dashboards; leave roster unchanged until metrics stable.

Backward Safety:
- New writes don’t change existing payload shape; old clients ignore unknown responses.

---
## 10. Mock + Live Coexist & Promotion
Architecture:
- DataService interface with providers: MockProvider, LiveProvider, HybridProvider.
- Hybrid read path: attempt live; if missing, fall back to mock and optionally queue promotion.
Promotion Flow (one-click):
1. Enumerate mock seed arrays (students, courses, assessments).
2. For each record absent in live DB: create doc with original IDs to preserve referential integrity.
3. Flip app mode flag to live-only.
4. Invalidate local caches.

Conflict Handling:
- If ID collision, append suffix and create mapping table `id_aliases` (mockId → liveId) then rewrite dependent references.

---
## 11. Backend-Only Strategy (Removing Mock Layer)
Steps:
1. Ensure seeding script covers: users, profiles, courses, enrollments, groups, assessments.
2. Migrate any hardcoded assignment arrays into DB.
3. Replace mock in dependency injection with LiveProvider after seed success.
4. Run smoke tests: login, fetch courses, roster, assignments list, submit an assignment.
5. Drop mock code behind feature flag, retain only for test/dev builds.

Risks:
- Race conditions during seed if called multiple times → add idempotency (lookup before create).
- Missing indexes cause slow roster queries → verify after migration.

---
## 12. Attendance & Session Analytics (Optional Phase)
Add when streaks and presence required.
Flow:
- Teacher starts lesson → creates lessons doc.
- Mark presence: create attendance_events per student.
- Daily aggregation updates: attendance rate influences riskScore formula.

RiskScore Formula (example):
```
riskScore = w1*(1-onTimeRate) + w2*(overdueCount/assignmentsReleased) + w3*(1-attendanceRate) + w4*(inactiveDays/30)
```
Weights tuned empirically.

---
## 13. Demo Seeding Checklist
Order:
1. Users (1 teacher, N students)
2. Profiles
3. Courses
4. Enrollments
5. Groups (optional)
6. Assessments (5–8 mixed types)
7. Submissions (seed a few graded + late examples)
8. Threads + messages (small sample)
9. Progress nodes (if showing engagement prototype)
10. Activity events (scripted historical to populate stats)

---
## 14. FYP Suitability Evaluation
- Novelty: Hybrid mock→live promotion, clear separation of effort vs grade, risk scoring pipeline.
- Reliability: Append-only events + derived tables, idempotent seeding.
- Extensibility: Adding reflections or timers doesn’t alter core contracts.
- Academic Depth: Analytics modeling + fairness in group grading justification.

---
## 15. Reflection / Homework Pattern (Proposed using assessment type "reflection")
Add fields if needed:
- assessments.reflectionPrompt (text)
- submissions.reflectionAnswer (text) or artifacts
Analytics tie-in: categorize reflection length / sentiment (store sentimentScore only).

---
## 16. Quick Field Matrix (Condensed)
| Domain | Collection | Core Keys | Purpose |
|--------|-----------|-----------|---------|
| Identity | users | id, email, role | Auth & authorization |
| Profile | profiles | userId | Display + cohort |
| Course | courses | code, teacherUserId | Teaching unit |
| Enrollment | enrollments | courseId, userId | Membership |
| Assessment | assessments | courseId, type, dueAt | Graded work |
| Submission | submissions | assessmentId, studentUserId/groupId | Student answer & grade |
| Progress | progress_nodes | courseId | Engagement taxonomy |
| State | node_state | nodeId, userId/groupId | Completion markers |
| Activity | activity_events | actorUserId, at | Analytics feed |
| Daily Stats | daily_student_stats | userId, date | Precomputed metrics |
| Group | groups | courseId | Collaboration container |
| Group Member | group_members | groupId, userId | Membership in group |
| Threads | threads | contextType, contextId | Conversation grouping |
| Messages | messages | threadId | Chat content |
| Attendance | attendance_events | sessionId, userId | Presence tracking |
| Lesson | lessons | courseId, startsAt | Scheduled instruction |
| Notification | notifications | userId | In-app alerts |

---
## 17. Copy / Export Tips
- Raw Copy: Open this Markdown file and use a plain text editor or VS Code "Copy With Syntax Highlighting".
- Sections: Each heading stands alone—safe to copy into Notion, Confluence, or Google Docs.
- Appwrite Setup: Use table names as collection IDs; convert PK suggestions into Appwrite document IDs or allow auto IDs then store prefixed id inside.

---
## 18. Next Optional Enhancements
- Add `personal_nodes` for student private task planning.
- Implement `riskScore` recalculation micro-task (cron every hour).
- Attach rubric JSON to assessments for structured feedback.
- Add `attachments` array to messages for richer chat.

---
## 19. Summary
This schema balances immediate demo viability (auth, roster, assignments, chat) with forward paths (engagement tracking, analytics, fairness scoring) while enforcing a clear separation between effort signals and formal grades. Promotion from mock to live is deterministic and reversible until you disable mock mode. Each collection is focused, indexable, and amenable to incremental rollout.

---
Feel free to prune sections you don't need for a lean submission. This document is designed for selective copying.
