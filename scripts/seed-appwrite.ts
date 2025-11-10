// scripts/seed-appwrite.ts
// Typed seed payload + adapter interface. Safe to import in the Expo repo without Node types.
// Implement a separate runner in Node/CI to call runSeed with a real Appwrite adapter.

import { courses, assignments } from '@/data/sample';
import { teachers, students, enrollments, lessons, notes, rubrics } from '@/data/academics';

// Data shapes used for seeding. Keep this small and app-agnostic.
export type SeedCourse = typeof courses[number];
export type SeedAssignment = typeof assignments[number];
export type SeedPerson = (typeof teachers | typeof students)[number];
export type SeedEnrollment = typeof enrollments[number];
export type SeedLesson = typeof lessons[number];
export type SeedNote = typeof notes[number];
export type SeedRubric = typeof rubrics[number];

export type SeedData = {
  courses: SeedCourse[];
  assignments: SeedAssignment[];
  people: SeedPerson[];
  enrollments: SeedEnrollment[];
  lessons: SeedLesson[];
  notes: SeedNote[];
  rubrics: SeedRubric[];
  // contentFiles are optional pointers to JSON assets (rubrics, decks) if you prefer file-based seeding
  contentFiles?: {
    rubrics?: Array<{ assignmentId: string; path: string }>;
    decks?: Array<{ courseId: string; lessonId: string; path: string }>;
  };
};

export function getSeedData(): SeedData {
  // Merge teachers + students for a flat people list
  const people: SeedPerson[] = [...teachers, ...students];

  // Optionally describe content JSON locations (keep paths stable)
  const contentFiles: SeedData['contentFiles'] = {
    rubrics: [
      { assignmentId: 'a-proto', path: 'content/rubrics/a-proto_rubric.json' },
      // Add more if/when you keep rubrics as JSON
    ],
    decks: [
      { courseId: 'c-eng201', lessonId: 'l-eng201-1', path: 'content/slides/c-eng201_l-eng201-1_deck.json' },
      { courseId: 'c-eng201', lessonId: 'l-eng201-2', path: 'content/slides/c-eng201_l-eng201-2_deck.json' },
      { courseId: 'c-cs305', lessonId: 'l-cs305-1', path: 'content/slides/c-cs305_l-cs305-1_deck.json' },
      { courseId: 'c-cs305', lessonId: 'l-cs305-2', path: 'content/slides/c-cs305_l-cs305-2_deck.json' },
      { courseId: 'c-math220', lessonId: 'l-math220-1', path: 'content/slides/c-math220_l-math220-1_deck.json' },
      { courseId: 'c-math220', lessonId: 'l-math220-2', path: 'content/slides/c-math220_l-math220-2_deck.json' },
    ],
  };

  return { courses, assignments, people, enrollments, lessons, notes, rubrics, contentFiles };
}

// Backend-agnostic adapter to keep the seeding logic simple and testable.
export interface SeedAdapter {
  upsertCourse(course: SeedCourse): Promise<void>;
  upsertAssignment(assignment: SeedAssignment): Promise<void>;
  upsertPerson(person: SeedPerson): Promise<void>;
  upsertEnrollment(enrollment: SeedEnrollment): Promise<void>;
  upsertLesson(lesson: SeedLesson): Promise<void>;
  upsertNote(note: SeedNote): Promise<void>;
  upsertRubric(rubric: SeedRubric): Promise<void>;
  // Optional file uploads (e.g., to storage) for content assets
  uploadContentFile?(params: { kind: 'rubric' | 'deck'; path: string; metadata: Record<string, string> }): Promise<void>;
}

// Orchestrates seeding using the provided adapter. No Node globals used.
export async function runSeed(adapter: SeedAdapter, data = getSeedData()) {
  // Order matters for foreign keys
  for (const c of data.courses) await adapter.upsertCourse(c);
  for (const p of data.people) await adapter.upsertPerson(p);
  for (const l of data.lessons) await adapter.upsertLesson(l);
  for (const n of data.notes) await adapter.upsertNote(n);
  for (const a of data.assignments) await adapter.upsertAssignment(a);
  for (const e of data.enrollments) await adapter.upsertEnrollment(e);
  for (const r of data.rubrics) await adapter.upsertRubric(r);

  if (adapter.uploadContentFile && data.contentFiles) {
    for (const r of data.contentFiles.rubrics || []) {
      await adapter.uploadContentFile({ kind: 'rubric', path: r.path, metadata: { assignmentId: r.assignmentId } });
    }
    for (const d of data.contentFiles.decks || []) {
      await adapter.uploadContentFile({ kind: 'deck', path: d.path, metadata: { courseId: d.courseId, lessonId: d.lessonId } });
    }
  }
}

// Example: Appwrite adapter skeleton (implement in a Node runner)
//
// import { Client, Databases, Storage, ID } from 'appwrite';
// export function makeAppwriteAdapter(opts: { endpoint: string; projectId: string; apiKey: string; databaseId: string; collections: Record<string,string> }): SeedAdapter {
//   const client = new Client().setEndpoint(opts.endpoint).setProject(opts.projectId).setKey(opts.apiKey);
//   const db = new Databases(client);
//   const storage = new Storage(client);
//   return {
//     async upsertCourse(course) { /* create/update in opts.collections.courses */ },
//     async upsertAssignment(a) { /* ... */ },
//     async upsertPerson(p) { /* ... */ },
//     async upsertEnrollment(e) { /* ... */ },
//     async upsertLesson(l) { /* ... */ },
//     async upsertNote(n) { /* ... */ },
//     async upsertRubric(r) { /* ... */ },
//     async uploadContentFile({ kind, path, metadata }) { /* read file and upload to storage */ },
//   };
// }
