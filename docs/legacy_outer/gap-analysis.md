# EduPlus Gap Analysis (Routes & Components)

> Date: 2025-11-08
> Purpose: Compare current app tree vs proposed structure and list missing pages/components with priorities.

---
## Summary

- Missing pages (core): 18 total
  - Teacher: 16 required
  - Student: 2 required (groups)
- Missing pages (optional/nice-to-have): 5
  - Student thread nesting (2), student tab notifications (1), teacher progress builder (1), auth forgot-password (1)
- Missing components (approx): 30 primitives/composites

---
## Current vs Proposed: Routes

### Present in repo (key excerpts)
- (auth): sign-in.tsx, sign-up.tsx
- (student)/(tabs): home.tsx, calendar.tsx, inbox.tsx, profile.tsx, scanner.tsx
- (student)/notifications/index.tsx
- (student)/course/[courseId]: index.tsx, overview.tsx, lessons.tsx, exams.tsx, people.tsx, assignments/index.tsx, assignments/[assignmentId].tsx
- (student)/threads/[threadId].tsx
- (teacher)/(tabs): home.tsx, calendar.tsx, inbox.tsx, profile.tsx, scanner.tsx

### Missing pages (Required)

Teacher (16):
1. (teacher)/(tabs)/create-course.tsx
2. (teacher)/(tabs)/my-courses.tsx
3. (teacher)/course/[courseId]/index.tsx
4. (teacher)/course/[courseId]/edit.tsx
5. (teacher)/course/[courseId]/roster.tsx
6. (teacher)/course/[courseId]/assessments.tsx
7. (teacher)/course/[courseId]/assessment/create.tsx
8. (teacher)/course/[courseId]/assessment/[assessmentId].tsx
9. (teacher)/course/[courseId]/submissions/[assessmentId]/index.tsx
10. (teacher)/course/[courseId]/submissions/[assessmentId]/[submissionId].tsx
11. (teacher)/course/[courseId]/groups/index.tsx
12. (teacher)/course/[courseId]/groups/manage.tsx
13. (teacher)/course/[courseId]/attendance/sessions.tsx
14. (teacher)/course/[courseId]/attendance/create-session.tsx
15. (teacher)/course/[courseId]/attendance/mark/[sessionId].tsx
16. (teacher)/course/[courseId]/analytics.tsx

Student (2):
17. (student)/course/[courseId]/groups/index.tsx
18. (student)/course/[courseId]/groups/[groupId].tsx

### Missing pages (Optional / can defer)
- (student)/(tabs)/notifications.tsx (you have /notifications/index.tsx already)
- (student)/course/[courseId]/threads/index.tsx and [threadId].tsx (threads currently top-level)
- (teacher)/course/[courseId]/progress.tsx (engagement builder; optional for FYP)
- (auth)/forgot-password.tsx

Notes:
- Student assessment detail can reuse assignments/[assignmentId].tsx; no extra page needed.
- If group work is out-of-scope initially, you may defer the 2 student group pages and the 2 teacher group pages.

---
## Components Gap

Planned primitives (ui/) vs present:
- Present: Button, Card, AppText, AvatarGroup, EmptyState, ErrorState, LoadingSpinner, SectionHeader, ProgressBar
- Missing primitives (~13): IconButton, Input, Select, Checkbox, Radio, Switch, TextArea, Badge, Avatar (single), Modal (generic), Sheet, Tabs, Skeleton, Toast

Layout (missing ~4): Screen, AppHeader, KeyboardAvoiding (wrapper), ScrollContainer

Data composites (missing ~8): UserRow, CourseCard, AssessmentCard, AssessmentList, SubmissionRow, GroupChip, AttendanceRow, StatTile

Teacher composites (missing ~5): RosterTable, GradeEditor, DueDatePicker, GroupManager, LessonScheduler

---
## Build Priority (Suggested)

1) Components
- ui: Button (done), Input, IconButton, Modal, Toast, Skeleton, Tabs
- layout: Screen, AppHeader, KeyboardAvoiding
- composites: AssessmentCard/List, SubmissionRow, RosterTable, GradeEditor, DueDatePicker

2) Student Screens (Core)
- Ensure assignments flow works end-to-end
- Add course group pages (index + detail) if group submissions are in scope

3) Teacher Screens (Core)
- (tabs) create-course, my-courses
- course management: index, edit, roster, assessments, assessment create/edit, submissions list + grade page
- attendance: sessions, create-session, mark
- analytics: minimal metrics page

4) Optional
- Threads nesting under course, progress builder, forgot-password, notifications tab

---
## Acceptance Coverage Check
- Student: sign-in, courses, assessments, submission, feedback → Covered by current + minor additions
- Teacher: create course, manage roster, create/release assessment, grade, manage attendance, see analytics → Requires listed missing pages
- Groups & shared grading → Requires group pages on both sides

---
## Notes
- Keep destructive actions as archive toggles; all edits audited (see data-model-export.md §1.3)
- Implement pages with a DataService provider to switch Mock→Live without rewriting UI
