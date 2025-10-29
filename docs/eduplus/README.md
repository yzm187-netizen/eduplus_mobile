# EduPlus – Mobile LMS with Analytics (Blueprint)

This document captures the initial plan for EduPlus: a mobile-first LMS with richer analytics for teachers and clear progress tooling for students and groups.

## Goals
- Student-centric experience: clear progress, assignments, notes, grades, attendance.
- Teacher insights: high-signal dashboards across courses and within each course.
- Group projects: section-based progress like branches (Introduction, Method, etc.), versioning and reviews.
- QR attendance: teacher generates a one-time QR, students scan to mark presence.
- Communication: inbox with notifications, threads, and group/DM chat.

## App targets and stack
- Mobile app: Expo + React Native + TypeScript
- Router: Expo Router (tabs + nested stacks)
- Styling: NativeWind (Tailwind for RN)
- State management: Zustand or Jotai (lightweight global state)
- BaaS: Appwrite (Auth, Database, Realtime, Functions)
- Media/Files: Appwrite Storage (for attachments, notes, submissions)
- Charts: Victory Native or react-native-svg + a small chart kit
- Camera/QR: expo-barcode-scanner (scanner) + qrcode generation on teacher screen
- Notifications: Expo Notifications (push) and/or in-app realtime (Appwrite)

## High-level navigation (tabs)
- Home: overview, upcoming deadlines, quick stats, per-course shortcuts.
- Calendar: classes, exams, assignment due dates, attendance reminders.
- Scanner: student QR scanner; teacher toggles to "Show QR" to display rotating codes for the current session.
- Inbox: threads (course forums, groups, DMs), mentions, announcements.
- Profile: account, settings, and personal analytics snapshot (grades, attendance, notes usage, progress trends).

## Course detail (per subject)
- Overview: syllabus/outline, latest announcements, active assignments.
- Analytics: grade distribution, median/mean, completion %, attendance %, at‑risk list, trend lines.
- Assignments/Projects: list + group project view with sections (branch-like), reviews, and history.
- Participants: roster, groups, contact/DM shortcuts.
- Resources/Notes: curated notes (teacher) + student notes (private unless shared with group).

## Analytics philosophy
- Start simple and trustworthy; expand later.
- Prefer explainable metrics: median, mean, percentile, completion, on-time ratio.
- Highlight outliers and trends (improving/declining) rather than raw dumps.

See companion docs:
- schema.md – database and permissions
- flows.md – key flows (QR attendance, group project, messaging)
- screens.md – IA, routes, component blocks
- metrics.md – KPIs and visualizations
