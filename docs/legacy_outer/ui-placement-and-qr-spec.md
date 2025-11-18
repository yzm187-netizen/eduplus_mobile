# UI Placement & QR Attendance Spec

Date: 2025-11-08

## 1. Analytics & Graph Placement

Teacher Dashboard (/(teacher)/(tabs)/home)
- Top Row StatTiles: On-Time Rate, Overdue Count, Avg Streak, Risk Alerts (# at-risk)
- Middle: Mini bar chart (overdue per course) + line sparkline (avg streak trend)
- Bottom: Grading Queue (list of assessments with ungraded submissions) & Upcoming Sessions

Course Overview (/(teacher)/course/[courseId])
- Hero: Course title + quick metrics (On-Time %, Overdue, Avg Streak)
- Section: Recent Submissions (latest 5) with status
- Section: Upcoming Assessments (next 3 by dueAt)
- Section: Attendance Snapshot (last 5 sessions presence %) – optional

Analytics Page (/(teacher)/course/[courseId]/analytics)
- Grid of StatTiles (On-Time Rate, Overdue Count, Median Streak, Risk Score Distribution)
- Chart 1: Line (On-Time Rate over last 4 weeks)
- Chart 2: Bar (Overdue count per week)
- Chart 3: Scatter (Effort vs Grade) – optional if grade data stable
- Table: Students sorted by Risk Score (top N) with quick drill link

Student Home (/(student)/(tabs)/home)
- Section: Due Soon (next 3 assignments)
- Section: Overdue (if any) – collapsible
- Streak Badge + On-Time % chip
- Progress (if enabled): tasks completed today vs target

Student Course Overview (/(student)/course/[courseId]/overview)
- On-Time % (course) + personal Streak
- Next Due + Overdue summary
- Latest Feedback (recent graded submissions)

## 2. Component Placement Map

StatTile
- Used in: Teacher dashboard, course overview hero, analytics grid, student home streak display (variant)

Charts.tsx
- Provide <LineChart />, <BarChart />, <ScatterChart /> wrappers with lazy loading (dynamic import) for performance.

AssessmentCard
- Locations: Student assignments list, Teacher assessments list

SubmissionRow
- Locations: Teacher submissions list, Student recent submissions panel

RosterTable (future)
- Teacher roster page: with columns (Name, Role, On-Time %, Overdue, Streak)

GradeEditor
- Teacher submission detail page: grade + feedback + history toggle

## 3. Dataset Readiness Check (Recap)
Ready: users, profiles, courses, enrollments, assignments/assessments (unified), submissions, groups, lessons, attendance_events (spec), progress_nodes, node_state, activity_events, daily_student_stats, notifications.
Pending Optional: personal_nodes, rubrics, explicit riskScore tuning weights.
No blocking gaps for attendance + QR integration.

## 4. Attendance with QR Code

### Goal
Fast marking: Students scan dynamic QR displayed by teacher; system logs presence (with anti-spoofing measures: time-bound token, course, session, optional network check).

### Data Additions
attendance_tokens (ephemeral, not persisted long-term) or embed token inside lessons.sessionToken
Fields (if separate collection):
- id (token id / ULID)
- lessonId
- courseId
- code (short alphanumeric or JWT)
- expiresAt (<= lesson start + grace window, e.g., 10 min)
- createdAt

### Flow
Teacher:
1. Creates lesson (startsAt/endsAt)
2. Presses "Generate QR" → backend creates token { lessonId, expiresAt }
3. QR displays encoded payload

Student:
1. Opens "Scan Attendance" (/(student)/(tabs)/scanner.tsx already present)
2. Camera scans QR → decode payload
3. App validates locally (current time < expiresAt)
4. Calls POST /attendance/mark { lessonId, proof: rawToken }
5. Backend verifies token exists & not expired → create attendance_event (present)

### Token Payload (embedded in QR)
JSON -> base64url (or compact JWT):
{
  "v":1,
  "lid":"les_xxxx",      // lessonId
  "cid":"crs_xxxx",      // courseId
  "exp": 1731056400,       // unix seconds
  "nonce":"8cQh..."      // random 8-12 bytes
}

Could also sign the payload (HMAC) if concerned about tampering.

### Security & Anti-Abuse
- Expiry window small (5–10 min)
- Nonce prevents brute-force token guessing
- Optional: include hashed Wi-Fi SSID or BSSID signature
  - Teacher device collects current network fingerprint
  - payload includes ws:"hash(SSID|BSSID|salt)"
  - Student client hashes its own Wi-Fi fingerprint and compares; if mismatch, warn or mark as pending approval.
- Rate limiting: max 1 successful mark per (lessonId, userId); duplicates ignored.
- Logging: activity_events("attendance_qr_scanned") for analytics.

### Regeneration
- Allow teacher to refresh token (invalidate previous by rotating lesson.sessionTokenVersion). Students scanning old token after rotation get 410 Gone.

### Edge Cases
- Student offline: fallback manual marking (teacher marks later)
- Late join: token expired → teacher manual override
- Shared screenshot: expired tokens minimize risk; network fingerprint reduces remote misuse

### Optional Enhancements
- Animated QR (refresh every 30–60s) with sequence number
- Include seat number (future) for seating analytics
- Geo-fencing coarse (lat/long radius) if network fingerprint insufficient

## 5. Implementation Steps (QR)
1. Backend: add endpoint POST /lessons/:id/attendance-token (teacher only)
2. Response: { code, expiresAt }
3. Teacher screen: show <QRCode value={code or payloadString} /> with countdown
4. Student scanner: parse payload → call POST /attendance/mark
5. Backend verify & persist attendance_event
6. Update daily_student_stats aggregator to incorporate QR-marked presence

## 6. Minimal Client Additions
- services/attendance.createToken(lessonId)
- services/attendance.markFromToken(tokenPayload)
- QRCode display component (teacher)
- Scanner hook: useQRCodeScanner()

## 7. Libraries
- QR generation: 'react-native-qrcode-svg'
- Scanner: 'expo-barcode-scanner' or 'react-native-vision-camera' (if more control)

## 8. Complexity Assessment
Effort: Low–Medium (1–2 days) given existing lessons/attendance scaffolding.
Biggest work: network fingerprint logic (optional) & token signing.

## 9. Risk Mitigation
- Keep manual marking path
- Strict server validation (lesson active window, not expired, unique per user)
- Log mismatches or suspicious submissions for review

## 10. Future Extension
- Auto mark late if scanned after window but before end time (status=late)
- Multi-factor proof (token + network + approximate location)
- Attendance trend charts fed by event stream
