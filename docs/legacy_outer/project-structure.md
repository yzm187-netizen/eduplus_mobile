# EduPlus Project Structure & Build Plan

> Date: 2025-11-08
> Stack: Expo + React Native + Expo Router, NativeWind, Zustand; Appwrite backend (Mock/Live/Hybrid providers)

---
## 1) Dataset completeness for FYP scope

Status: PASS for planned scope.

Covered (authoritative in data-model-export.md):
- Identity/Auth: users, profiles, roles (student/teacher), optional isAdmin
- Courses & enrollments: ownership, multi-teacher via enrollments
- Assessments & submissions: assignments/tests/exams/quizzes/reflections (group/individual)
- Chat: threads/messages per course/assessment/group
- Groups: membership, group submissions
- Attendance: lessons + attendance_events
- Engagement: progress_nodes + node_state (teacher-governed), activity_events, daily_student_stats
- Notifications: in-app course-scoped notifications
- Analytics: on-time, overdue, streaks, minutes active, risk score

Intentional “later” (optional):
- Task governance knobs (countsTowardEffort flag) – already modeled
- Timer – inferred sessions first; dedicated timer optional
- Rubrics – can add assessments.rubric JSON later
- Admin/tenant-wide controls – out of scope for FYP

Conclusion: You can implement student + teacher flows with current schema. Optional knobs won’t block core UX.

---
## 2) Monorepo layout (top-level)

- app/                      # Expo Router routes
- components/               # Reusable UI primitives & composites
- features/                 # Domain modules (logic + screens + subcomponents)
- services/                 # Data providers (mock/live/hybrid) + SDK wrappers
- stores/                   # Zustand stores (session/ui/cache)
- hooks/                    # Reusable hooks
- lib/                      # Utilities (dates, ids, validation, formatting)
- types/                    # Shared TS types/interfaces
- styles/                   # Theme, tokens, Tailwind config
- assets/                   # Images, icons, fonts, lotties
- config/                   # Env/mode config
- tests/                    # Unit/e2e tests
- scripts/                  # Seed/promotion/dev scripts
- docs/                     # Documentation (already present)

---
## 3) Routes (Expo Router) – suggested tree

app/
  _layout.tsx                      # Root layout (theme, SafeArea, toasts)
  +not-found.tsx

  (auth)/
    _layout.tsx
    sign-in.tsx
    forgot-password.tsx            # optional

  (student)/
    _layout.tsx
    (tabs)/
      index.tsx                    # Home/Overview (assignments due, notifications)
      courses.tsx                  # My Courses list
      notifications.tsx
      profile.tsx

    course/
      [courseId]/
        index.tsx                  # Course overview (assignments snapshot, threads)
        people.tsx                 # Roster (read-only)
        assignments.tsx            # List (filter: upcoming/overdue)
        assessment/
          [assessmentId].tsx       # Details + submit/edit submission
        groups/
          index.tsx                # My groups in course
          [groupId].tsx            # Group details + submission
        threads/
          index.tsx
          [threadId].tsx

  (teacher)/
    _layout.tsx
    (tabs)/
      index.tsx                    # Dashboard (classes, grading queue, alerts)
      create-course.tsx
      my-courses.tsx

    course/
      [courseId]/
        index.tsx                  # Course overview (quick stats)
        edit.tsx                   # Title, grading rule
        roster.tsx                 # Add/remove students, TA
        assessments.tsx            # Manage assessments
        assessment/
          create.tsx
          [assessmentId].tsx       # Edit, gradebook view
        submissions/
          [assessmentId]/
            index.tsx              # Submissions list (grade queue)
            [submissionId].tsx     # Grade/regrade
        groups/
          index.tsx                # Create/manage groups
          manage.tsx
        attendance/
          sessions.tsx             # Lessons list
          create-session.tsx
          mark/
            [sessionId].tsx        # Mark attendance
        analytics.tsx              # On-time / overdue / streaks / risk
        progress.tsx               # Build official engagement tree (optional)

---
## 4) Components – build these first

Prioritize a small, consistent design system. Start with primitives, then composites.

components/
  ui/               # Primitives
    Button.tsx
    IconButton.tsx
    Input.tsx
    Select.tsx
    Checkbox.tsx
    Radio.tsx
    Switch.tsx
    TextArea.tsx
    Badge.tsx
    Avatar.tsx
    Card.tsx
    Modal.tsx
    Sheet.tsx
    Tabs.tsx
    ProgressBar.tsx
    Skeleton.tsx
    Toast.tsx

  layout/
    Screen.tsx              # SafeArea + padding + bg
    AppHeader.tsx           # Title + actions
    KeyboardAvoiding.tsx
    ScrollContainer.tsx
    EmptyState.tsx
    ErrorState.tsx
    LoadingSpinner.tsx

  data/            # Shared composites
    UserRow.tsx
    CourseCard.tsx
    AssessmentCard.tsx
    AssessmentList.tsx
    SubmissionRow.tsx
    GroupChip.tsx
    AttendanceRow.tsx
    StatTile.tsx            # metric/value/Delta

  teacher/
    RosterTable.tsx
    GradeEditor.tsx         # inline grade + feedback with keyboard safe area
    DueDatePicker.tsx
    GroupManager.tsx
    LessonScheduler.tsx

Notes:
- Keep props serializable, typed via types/.
- All components dark-mode friendly. Use NativeWind classes + theme tokens.

---
## 5) Features – domain modules

features/
  auth/
    screens/: SignInScreen.tsx
    api.ts: signIn/out, session refresh
    useAuth.ts

  courses/
    screens/: CoursesList.tsx, CourseOverview.tsx
    api.ts: listCourses, getCourse, createCourse, updateCourse
    useCourses.ts

  enrollments/
    api.ts: add/remove enrollment

  assessments/
    screens/: AssessmentsList.tsx, AssessmentDetail.tsx, ManageAssessments.tsx
    api.ts: listAssessments, create/update/archive, release
    useAssessments.ts

  submissions/
    screens/: SubmissionDetail.tsx, GradeQueue.tsx
    api.ts: submit, grade, regrade, reopen
    useSubmissions.ts

  chat/
    screens/: Threads.tsx, ThreadDetail.tsx
    api.ts: createThread, postMessage, moderate
    useThreads.ts

  groups/
    screens/: GroupsList.tsx, GroupDetail.tsx, ManageGroups.tsx
    api.ts: createGroup, addMember, removeMember

  attendance/
    screens/: Sessions.tsx, MarkAttendance.tsx
    api.ts: createLesson, listLessons, markAttendance

  progress/
    screens/: ProgressBuilder.tsx
    api.ts: createNode, updateNode, deactivateNode, setNodeState

  analytics/
    screens/: TeacherAnalytics.tsx
    api.ts: getCourseStats, getStudentStats

---
## 6) Data services & adapters

services/
  data-service.ts        # Interface: all methods used by features
  providers/
    mock/                # In-memory/static JSON implementation
    live/                # Appwrite SDK implementation
    hybrid/              # Read-through w/ promotion hooks (optional)
  http/                  # If any REST wrapper needed

Interface sketch (abbrev):
```
export interface DataService {
  auth: { signIn(email: string, password: string): Promise<Session>; signOut(): Promise<void>; me(): Promise<User>; };
  courses: { list(): Promise<Course[]>; get(id: Id): Promise<Course>; create(input): Promise<Course>; update(id, patch): Promise<void>; };
  enrollments: { add(courseId, userId, role): Promise<void>; remove(id): Promise<void>; };
  assessments: { list(courseId): Promise<Assessment[]>; create(courseId, input): Promise<Assessment>; update(id, patch): Promise<void>; release(id): Promise<void>; };
  submissions: { list(assessmentId): Promise<Submission[]>; get(id): Promise<Submission>; submit(input): Promise<Submission>; grade(id, input): Promise<void>; reopen(id): Promise<void>; };
  threads: { list(ctx): Promise<Thread[]>; create(ctx, input): Promise<Thread>; post(threadId, input): Promise<Message>; moderate(msgId, patch): Promise<void>; };
  groups: { list(courseId): Promise<Group[]>; create(courseId, input): Promise<Group>; addMember(groupId, userId): Promise<void>; removeMember(groupId, userId): Promise<void>; };
  attendance: { listLessons(courseId): Promise<Lesson[]>; createLesson(courseId, input): Promise<Lesson>; mark(sessionId, userId, status): Promise<void>; };
  progress: { listNodes(courseId): Promise<Node[]>; createNode(courseId, input): Promise<Node>; setState(nodeId, subject, status): Promise<void>; };
  analytics: { course(courseId): Promise<CourseStats>; student(courseId, userId): Promise<StudentStats>; };
  notifications: { send(courseId, input): Promise<void>; };
}
```

---
## 7) State management (Zustand)

stores/
  useSessionStore.ts     # auth, current user, token
  useUiStore.ts          # theme, toasts, dialogs
  useCourseStore.ts      # selected course, ephemeral view state
  useCacheStore.ts       # simple normalized caches per entity (optional)

Notes: Keep server state via react-query (optional) or minimal fetch + cache store. Avoid duplicating sources of truth.

---
## 8) Hooks & lib

hooks/
  useAsync.ts
  useDebouncedValue.ts
  useKeyboardAwareSubmit.ts
  useListSearch.ts

lib/
  dates.ts               # due/late utils, streaks, ranges
  ids.ts                 # prefixed ULID helpers
  format.ts              # names, scores, durations
  validation.ts          # zod schemas (optional)
  analytics.ts           # small calculators for on-time %, streaks, etc.

---
## 9) Types & styles

- types/: Align to data-model-export.md; keep Id types and discriminated unions for Assessment.type & mode.
- styles/: tailwind.config, theme tokens (colors, spacing, radius), typography presets.

---
## 10) Implementation order (practical)

1. Design system
   - Build primitives in components/ui + layout scaffolding, dark-mode aware.
2. Data contracts
   - Add TypeScript types in types/; stub DataService interface.
3. Services
   - Mock provider first (static JSON or in-memory), then Live (Appwrite), optional Hybrid.
4. Core student flows
   - Sign-in → courses list → course overview → assignments list → assessment detail → submit.
5. Core teacher flows
   - Create course → roster manage → create assessment → release → grade queue → grade submission.
6. Attendance & groups
   - Lessons create/mark; group creation and group submissions.
7. Analytics & notifications
   - Minimal course stats, due soon + grade released notifications.
8. Engagement (optional for FYP)
   - Progress builder + student completion markers.
9. Polish
   - Empty/Loading states, pull-to-refresh, accessibility, keyboard handling.

---
## 11) Testing & scripts

- Unit tests for lib and hooks. Snapshot tests for components.
- Light integration tests around submissions and grading flows.
- scripts/seed-appwrite.* to populate demo data; promotion script for mock→live.

---
## 12) Acceptance criteria (green-before-done)

- Student can: sign in, see courses, view assessments, submit, see feedback.
- Teacher can: create course, manage roster, create/release assessment, grade, manage attendance, see analytics.
- Group assessment: single group submission, shared grade, membership snapshot preserved.
- Performance: roster/assessments load <1s on typical device with seeded data.
- Reliability: edits are audited; archives never delete historical submissions/messages.

---
## 13) Notes

- Components first is a good approach: lock visual primitives, then compose screens.
- Keep domain logic inside features/ (not inside components/) so components remain reusable.
- Use feature flags for optional engagement/analytics to keep scope focused.
