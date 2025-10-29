# EduPlus – Key Flows

## QR Attendance
Actors: teacher, student, backend function

- Teacher starts session -> create `sessions` doc with startsAt/endsAt and a rotating token seeded by (sessionId + qrSalt).
- Teacher screen displays a QR that encodes {sessionId, one-time token, expiry}. Token rotates every 15–30s.
- Student scans QR with camera -> client validates expiry locally, POSTs (sessionId, token) to backend function.
- Function verifies token: recompute token for current window using server-side qrSalt; reject replays by storing `tokenHash` per user per window.
- On success: create attendance record (courseId, sessionId, userId, scannedAt, deviceInfo, tokenHash). Return confirmation.
- Edge cases: late scans, duplicate scans, offline (queue and submit within grace period), spoofing (bind to userId + device signature; short TTL token).

## Group Project – Section Versioning
Actors: student (group member), teacher

- Sections are predefined by teacher or created by group (Introduction, Methods, Results, etc.).
- Each edit creates a new `sectionVersions` document linked to `projectSections.sectionId`.
- `latestVersionId` is updated via transaction to point to the newest approved or ready version.
- Teacher can review versions, comment (future), and set status to approved; group members can continue to iterate.
- Diffing: optional – store previous content to compute diffs client-side.

## Messaging & Notifications
- Threads: course forum, group chat, or DM; `threads` define membership and context.
- Messages stream via Appwrite Realtime on the `messages` collection.
- Attachments uploaded to Appwrite Storage with references in message.
- Push notifications: Expo Notifications – trigger on mentions, teacher announcements.

## Calendar & Deadlines
- Calendar aggregates sessions (classes), assignments (dueAt), and exams.
- Local reminders via Notifications scheduled by dueAt - leadTime.

## Analytics Computation
- Triggered by cron (scheduled function) and on-write events:
  - Grade Distribution, Median/Mean, Completion %, On-time ratio, Attendance %, Streaks, Velocity (submissions/week), At-risk (low grade + low attendance + declining trend).
- Cache results in `analyticsCache` for fast reads; invalidate selectively on writes.
