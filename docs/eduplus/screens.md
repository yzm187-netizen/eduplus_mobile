# EduPlus – Screens & IA

## Tabs
- Home
  - Header: greeting, quick stats (GPA, attendance %, due soon)
  - Sections: My Courses (cards with mini-analytics), Announcements, Quick Actions (Scan, Add Note)
- Calendar
  - Month/Week views
  - Items: classes, exams, assignment due dates
  - Filters by course
- Scanner
  - Student: camera view with scan result sheet
  - Teacher: toggle to show rotating QR for the active session
- Inbox
  - List of threads grouped by course/group/DM
  - Detail: message list, input, attachments
- Profile
  - Account & settings
  - Personal analytics snapshot: grade trend, attendance streak, completion %, study time proxy (notes edits)

## Course (Subject) Stack
- Course Home
  - Overview: syllabus, top resources, upcoming items
  - Analytics: cards with grade median/mean, distribution sparkline, attendance %, completion %, at-risk count
- Assignments
  - List with status chips (not started, in progress, submitted, graded)
  - Assignment Detail: description, attachments, submit/upload, grade & feedback
- Group Project
  - Sections list (Introduction, Methods, Results, etc.) with status
  - Section Detail: latest version, version history, approve/review controls
- People
  - Roster, groups, quick DM
- Resources/Notes
  - Teacher resources, student notes (private/group/course visibility)

## Reusable UI Blocks
- AnalyticsCard, ProgressBar, DistributionChart, TrendLine, AttendanceHeatmap, EmptyState, ErrorState

## Routing shape (Expo Router)
- app/(tabs)/index.tsx – Home
- app/(tabs)/calendar.tsx – Calendar
- app/(tabs)/scanner.tsx – Scanner
- app/(tabs)/inbox.tsx – Inbox
- app/(tabs)/profile.tsx – Profile
- app/courses/[id]/index.tsx – Course Home
- app/courses/[id]/analytics.tsx – Course Analytics
- app/courses/[id]/assignments/index.tsx – Assignments List
- app/courses/[id]/assignments/[aid].tsx – Assignment Detail
- app/courses/[id]/project/index.tsx – Sections
- app/courses/[id]/project/[sid].tsx – Section Detail
- app/threads/[tid].tsx – Thread Detail
