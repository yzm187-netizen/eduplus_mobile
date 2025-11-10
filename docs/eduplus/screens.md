# EduPlus – Screens & IA

## Tabs
- Home (Student)
  - Header: greeting
  - Banner snapshot: 3–4 metrics visible by default (initial: Due soon count, Completed assignments, Weekly study hours). Full metrics list lives in Profile.
  - Notifications: scrollable window with badges (any notification type can show a numeric badge). Tap navigates to specific assignment page in the relevant course.
  - My Courses: full-width cards with optional badges (new notes, new grades). Tap enters Course hub.
- Calendar (Student)
  - Agenda + Month/grid toggle.
  - Items: classes, exams, assignment due dates (initially assignments only in UI).
  - Filters by course (planned).
- Scanner
  - Student: camera view with scan result sheet
  - Teacher: toggle to show rotating QR for the active session
- Inbox
  - List of threads grouped by course/group/DM
  - Detail: message list, input, attachments (mock supports attaching a sample PDF/image with remote URLs; PDFs open in in-app PDF viewer)
- Profile
  - Account & settings
  - Personal analytics snapshot: grade trend, attendance streak, completion %, study time proxy (notes edits); full metrics list.

## Course (Subject) Hub (Student)
- Sections: Overview, Lessons, Assignments, Exams, People — confirmed.
- Resources/Notes split: Teacher resources vs Community notes/resources (course-wide). Student notes can be private/group/course scope.
- People: tapping a profile opens the same public stats view as the person profile tab (no settings/private info).
- Assignments
  - List with status chips (not started, in progress, submitted, graded)
  - Assignment Detail: description, attachments, submit/upload, grade & feedback
  - Attachments: max 3 for now; any recognizable format
  - Collaboration privacy: separate teammate-only group vs teacher-involved group
  - Sectioned work versioning: each section can be published as v1, v2, ... Students pick final per-section versions, then submit the whole as final for grading
  - New: top-down expandable sections with nested subtasks (recursive checklist) and per-section progress bars; roll-up progress at the top. You can add subtasks at any level. Submission is gated until all sections have a final version selected and all tasks are 100% complete across the hierarchy.

Lessons now render a simple outline plus “Notes & Resources” list. Tapping a note opens an in-app viewer (markdown/plain text). PDF preview is supported via a WebView-based screen when provided a remote URL; native PDF viewers require a dev client.

## Reusable UI Blocks
- AnalyticsCard, ProgressBar, DistributionChart, TrendLine, AttendanceHeatmap, EmptyState, ErrorState

## Current polish status (Student)
- Pull-to-refresh on Home, Calendar, and Assignments list.
- Relative timestamps (e.g., “in 3d”, “2d ago”) on notifications and due dates.
- Lightweight icons for KPI tiles and badges for clearer scannability.
- Next: skeleton loaders, better empty and error states, and improved date formatting for locales.

## Routing shape (Expo Router)
- Student tabs: app/(student)/(tabs)/{home,calendar,scanner,inbox,profile}.tsx
- Student course stack: app/(student)/course/[courseId]/index.tsx (Overview)
  - app/(student)/course/[courseId]/assignments/[assignmentId].tsx (Assignment Detail)
- Teacher tabs: app/(teacher)/(tabs)/{home,calendar,scanner,inbox,profile}.tsx

## Teacher Interface (initial)
- Home/Insights: class-level stats (grade distribution, completion %, attendance), at-risk highlights; drill into student-level performance
- Courses: manage course details, lessons, resources; moderate community notes/resources
- Assignments: create/edit, review submissions, grade
- People: roster, teams/groups, quick DM
- Calendar: agenda first; month/grid available

## Content & preview
- For Expo Go compatibility, notes render as markdown/plain text in-app. Image previews are supported via Image; PDF preview is available via WebView with a remote URL (or native PDF in a dev client).
- When ready to accept real documents, provide public URLs or include them as bundled assets and we’ll wire a simple WebView-based preview.
