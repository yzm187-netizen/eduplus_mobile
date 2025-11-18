# EduPlus Report — Chapters 4 to 6

Note: Use this as a living document. Replace TODOs and add screenshots as features ship.

## 4. System Design and Implementation

### 4.1 Introduction
- Overview: React Native (Expo) app + Appwrite backend (DB, Storage, Auth).
- Key modules: Lessons, Assignments, Chat, Attendance, Profile/Analytics.
- Data: `courses`, `lessons`, `notes`, `assessments`, `enrollments`, `profiles`, `attendance`.

### 4.2 Program Design and Coding

4.2.1 Authentication
- Screenshot: Login screen.
- Code snippet (screenshot): `services/live/auth.ts` sign-in function and `lib/appwrite.ts` client setup.
- Notes: Session handling and role detection.

4.2.2 Lessons (Teacher)
- Screenshot: Lesson list with swipe actions + edit modal.
- Code snippet (screenshot): `app/(student)/course/[courseId]/lessons.tsx` — `openAttachment`, edit modal upload block.
- Code snippet (screenshot): `services/providers.ts` — `createNoteWithAttachment` and `uploadLessonImage` showing `Permission.read(Role.any())` and `InputFile?.fromUri` fallback.
- Expected behavior: Upload doc/image → immediately preview; open via Appwrite view URL; complete toggle persists.

4.2.3 Lessons (Student)
- Screenshot: Collapsed/expanded lesson with resources.
- Notes: No edit controls; can open resources; “preparing…” state for pending uploads hidden once replaced.

4.2.4 Assignments
- Screenshot (after MVP): Assignment creation (teacher) and per-section student tasks.
- Code snippet (screenshot): `services/providers.ts` assignment CRUD and group linkage (to be added).

4.2.5 Chat
- Screenshot (after MVP): Group chat and course chat, attachments.
- Code snippet (screenshot): Chat service send/receive and storage attach (to be added).

4.2.6 Attendance
- Screenshot (after MVP): QR screen (teacher) and scan (student) or manual tick list.
- Code snippet (screenshot): Attendance create/mark APIs (to be added).

### 4.3 Interface Design and Development
- Provide one screenshot per key screen + brief caption:
  - Courses list
  - Lessons list (student)
  - Lesson edit (teacher)
  - Assignments list (student) and create (teacher)
  - Chat threads and message view
  - Attendance (teacher/student)
  - Profile & Analytics

## 5. System Testing

5.1 Introduction
- Testing strategy: Feature-by-feature manual validation with RN + Appwrite.

5.2 Unit Testing (where applicable)
- Describe any pure logic tests (if implemented).

5.3 Integration Testing
- Lessons: Upload → appears in bucket → in-app opens via view URL.
- Assignments: Create → visible to student → student tasks → grading updates.
- Chat: Send/receive, attachments open, read receipts.
- Attendance: Generate/scan QR, manual mark, record visible to student/teacher.

5.4 System Testing
- End-to-end walkthroughs per persona.
- Screenshots: Before/after state where helpful.

## 6. Conclusion

6.1 Strengths
- Simple, mobile-first UX; Appwrite-managed auth, storage, and data.

6.2 Problems Faced and Solutions
- RN file uploads: `InputFile` availability → used `InputFile?.fromUri` with `{uri,name,type}` fallback and public read permissions.
- Android local URIs: Avoid opening `file://`; build public view URL.

6.3 Future Suggestions
- Offline notes caching, richer grading rubrics, push notifications.

6.4 Summary
- Project achieves core classroom features with modular services and scalable backend.

---

Checklist: Screenshots To Capture
- Login screen
- Teacher: Lessons list (swipe showing Edit/Delete), Edit modal (image selected), Resources list
- Student: Lessons list expanded with resources
- Assignments: Teacher create; Student task per section; Grading screen
- Chat: Thread list; Group chat; Attachment preview
- Attendance: QR generate; Student scan; Manual tick list
- Profile & Analytics: Summary cards and charts
