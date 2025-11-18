# Appwrite Maintenance Scripts

This directory contains one-off and batch maintenance utilities. All scripts assume a valid `.env` in the project root (`eduplus/.env`) with at least:

```
APPWRITE_ENDPOINT=...
APPWRITE_PROJECT_ID=...
APPWRITE_API_KEY=...
APPWRITE_DATABASE_ID=...
```

Optional envs for specific scripts:
- `APPWRITE_BUCKET_LESSON_IMAGES` / `APPWRITE_BUCKET_NOTES` – storage bucket IDs.
- `TEAM_TEACHERS_GLOBAL` – global teachers team id.
- `COLS` – comma-separated collection ids for inspection scripts.

Scripts overview:

| Script | Purpose |
|--------|---------|
| `ensure-global-teams.js` | Creates global teachers/students teams if missing. |
| `grant-bucket-course-teams.js` | Applies course team permissions to a storage bucket. |
| `grant-bucket-users-create*.js` | Temporarily allows user file creation (debug). |
| `grant-course-permissions.js` | Backfills per-course teacher/user document permissions. |
| `grant-course-team-permissions.js` | Grants a single global teacher team read/update/delete rights across courses. |
| `fix-course-teachers.js` | Normalizes `teacherIds` arrays on courses. |
| `fix-course-created-by.js` | Aligns course ownership metadata with actual creator. |
| `fix-lesson-perms.js` | Backfills lesson document permissions (teacher/team). |
| `fix-profile-name.js` | Cleans or corrects profile name attributes. |
| `inspect-courses.js` / `inspect-lessons.js` / `inspect-profiles.js` | Dumps selected entities (debug). |
| `check-collection-security.js` | Prints documentSecurity + collection permissions. |
| `enable-doc-security.js` | Enables document-level security on collections. |
| `list-lessons-by-course.js` | Lists lessons grouped by course id. |
| `list-student-courses.js` | Lists courses for a given student. |
| `verify-teacher-scope.js` | Verifies teacher permissions coverage. |
| `set-notes-collection-perms.js` | Sets create/update/delete/read perms for notes collection. |
| `seed-*.js / seed-*-lessons.js` | Inserts demo lessons/assignments/notes. |
| `expand-course-description.js` | Adds or extends long description field. |
| `upload-test-file.js` | Simple storage file upload test harness. |
| `time-shift-demo-dates.js` | Shifts demo dates forward (keep samples fresh). |

Conventions:
- All scripts are idempotent where practical; re-running should not corrupt data.
- Prefer explicit logging with a prefix `[script-name]` for grep-ability.
- Fallback environment loader parses `.env` if `dotenv` preload is absent.

Running examples:
```
node -r dotenv/config scripts/appwrite/check-collection-security.js
COLS=notes,courses node scripts/appwrite/check-collection-security.js
TEAM_TEACHERS_GLOBAL=teachers_global node scripts/appwrite/verify-teacher-scope.js
```

Add new scripts by placing them here and updating this README.
