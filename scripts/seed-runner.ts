// scripts/seed-runner.ts
// Node-only runner for seeding Appwrite from local data/content.
// Requires: devDependencies node-appwrite, dotenv, and ts-node (if running directly).

import 'dotenv/config';
import { Client, Databases, Storage, ID } from 'node-appwrite';
import path from 'node:path';
import { getSeedData, runSeed, type SeedAdapter } from './seed-appwrite';

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  APPWRITE_USERS_COLLECTION_ID,
  APPWRITE_COURSES_COLLECTION_ID,
  APPWRITE_ASSIGNMENTS_COLLECTION_ID,
  APPWRITE_LESSONS_COLLECTION_ID,
  APPWRITE_NOTES_COLLECTION_ID,
  APPWRITE_RUBRICS_COLLECTION_ID,
  APPWRITE_BUCKET_ID,
} = process.env as Record<string, string | undefined>;

function assertEnv(k: string, v: string | undefined) {
  if (!v) throw new Error(`Missing env ${k}. Copy .env.example to .env and fill values.`);
}

assertEnv('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT);
assertEnv('APPWRITE_PROJECT_ID', APPWRITE_PROJECT_ID);
assertEnv('APPWRITE_API_KEY', APPWRITE_API_KEY);
assertEnv('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID);

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT!)
  .setProject(APPWRITE_PROJECT_ID!)
  .setKey(APPWRITE_API_KEY!);

const db = new Databases(client);
const storage = new Storage(client);

function hasId(id?: string): id is string { return !!id && id !== 'REPLACE_ME'; }

async function upsert<T extends Record<string, any>>(collectionId: string | undefined, id: string, data: T) {
  if (!hasId(collectionId)) return { skipped: true } as const;
  try {
    await db.createDocument(APPWRITE_DATABASE_ID!, collectionId, id, data);
    return { created: true } as const;
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('409') || msg.includes('already exists')) {
      await db.updateDocument(APPWRITE_DATABASE_ID!, collectionId, id, data as any);
      return { updated: true } as const;
    }
    throw err;
  }
}

const adapter: SeedAdapter = {
  async upsertCourse(course) {
    await upsert(APPWRITE_COURSES_COLLECTION_ID, course.id, {
      code: course.code,
      name: course.name,
      color: (course as any).color ?? null,
      badges: (course as any).badges ?? null,
    });
  },
  async upsertAssignment(a) {
    await upsert(APPWRITE_ASSIGNMENTS_COLLECTION_ID, a.id, {
      courseId: a.courseId,
      title: a.title,
      dueAt: a.dueAt,
      description: (a as any).description ?? null,
    });
  },
  async upsertPerson(p) {
    await upsert(APPWRITE_USERS_COLLECTION_ID, p.id, {
      name: p.name,
      role: p.role,
      program: (p as any).program ?? null,
    });
  },
  async upsertEnrollment(e) {
    // You may model enrollments as a separate collection or embed on course/user.
    // If you have a dedicated collection, set APPWRITE_ENROLLMENTS_COLLECTION_ID and upsert there.
    // Skipping by default to avoid schema assumptions.
    return;
  },
  async upsertLesson(l) {
    await upsert(APPWRITE_LESSONS_COLLECTION_ID, l.id, {
      courseId: l.courseId,
      title: l.title,
      order: l.order,
    });
  },
  async upsertNote(n) {
    await upsert(APPWRITE_NOTES_COLLECTION_ID, n.id, {
      courseId: n.courseId,
      lessonId: n.lessonId,
      authorId: n.authorId,
      visibility: n.visibility,
      title: n.title,
      content: n.content,
      createdAt: n.createdAt,
    });
  },
  async upsertRubric(r) {
    await upsert(APPWRITE_RUBRICS_COLLECTION_ID, r.assignmentId, {
      assignmentId: r.assignmentId,
      title: r.title,
      criteria: r.criteria,
      totalPoints: r.totalPoints,
    });
  },
  async uploadContentFile() {
    // Optional: implement when you want to upload JSON files to a Storage bucket.
    // Requires APPWRITE_BUCKET_ID and reading the file from disk.
    return;
  },
};

(async () => {
  const data = getSeedData();
  const canUpload = hasId(APPWRITE_BUCKET_ID);
  const enhancedAdapter: SeedAdapter = {
    ...adapter,
    async uploadContentFile(params) {
      if (!canUpload) return;
      const abs = path.resolve(process.cwd(), params.path);
      const base = path.basename(abs);
      const stamped = `${params.kind}_${Date.now()}_${base}`;
      const mod: any = await import('node-appwrite');
      const file = mod.InputFile.fromPath(abs, stamped);
      await storage.createFile(APPWRITE_BUCKET_ID!, ID.unique(), file);
      // You can also create a document pointing to this file if desired.
    },
  };

  await runSeed(enhancedAdapter, data);
  console.log('Seed completed.');
})().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
