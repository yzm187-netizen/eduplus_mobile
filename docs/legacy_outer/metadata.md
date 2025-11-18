# Demo vs System Metadata

This document explains which timestamps and creator fields you can safely change for demos and which are immutable system values.

## Course Documents
- `$createdAt` (system): Set by Appwrite automatically; cannot be changed.
- `createdAt` (custom field): Added in the app when creating a course; you can edit this for demo ordering or scenarios.
- `createdBy` (custom field): The userId of the creator captured at creation time. Can be updated via scripts (e.g., reassignment) for demo needs.

### Editing Demo Fields
Use the fix scripts:
```bash
TEACHER_ID=<newTeacherId> npm run fix:course-created-by
```
Or manually update `createdAt` / `createdBy` in the Console (document update) — Appwrite will accept changes because they are normal attributes.

## Lessons & Assignments
- `$createdAt` (system): Immutable.
- `createdAt` (custom, assignments seeded): Editable; changing it does not affect internal ordering unless UI code sorts by it.
- For lessons, ordering is computed by `startsAt`; adjust `startsAt`/`endsAt` to demo scheduling changes.

## Group vs Individual Assignments
- `groupType`: Custom field (`group` | `individual`) added by seeding script. Safe to edit to change how the UI labels an assignment. The UI derives the badge from this field only.

## Recommended Demo Flow
1. Create a fresh course (captures `createdBy` automatically).
2. Run seeding script to populate lessons & assignments.
3. Adjust `createdAt` or due dates to stage timeline scenarios.
4. (Optional) Shift all dates relative to today:
```bash
DAYS=-3 npm run shift:demo-dates
```
5. Use fix scripts to reassign ownership if demonstrating teacher role handoff.

## Scripts Overview
- `seed:lessons-assignments`: Adds demo lessons & assignments, setting `groupType` accordingly.
- `fix:course-created-by`: Backfills or reassigns `createdBy`.
- `shift:demo-dates`: Bulk shifts course createdAt, assignment dueAt/createdAt, and lesson startsAt/endsAt by DAYS offset.

## Safe Adjustments Table
| Field        | Safe to Edit | Effect                               |
|--------------|--------------|--------------------------------------|
| createdAt    | Yes          | Changes displayed creation date only |
| createdBy    | Yes          | Updates UI label, audit semantics    |
| startsAt/endsAt (lesson) | Yes | Reschedules lesson chronology     |
| dueAt (assignment) | Yes     | Shifts deadline + relative labels   |
| $createdAt   | No           | Immutable system timestamp           |

## Best Practice
Keep original `$createdAt` for true audit needs; use `createdAt` for demo narrative (e.g., make a course appear “new” today). Document any demo mutations if exporting data.
