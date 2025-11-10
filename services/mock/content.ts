import type { ContentService } from '@/services/contracts';
import { lessons, notes, rubrics, teachers, students } from '@/data/academics';
import { decks } from '@/data/decks';

// In mock mode, assume we're a student; filter out private notes unless authored by self (unknown user in mock), so keep only course/group visibility
export const mockContent: ContentService = {
  async listLessons(courseId: string) {
    return lessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order);
  },
  async listNotes(courseId: string) {
    return notes.filter((n) => n.courseId === courseId && n.visibility !== 'private');
  },
  async getNote(noteId: string) {
    return notes.find((n) => n.id === noteId) ?? null;
  },
  async getRubric(assignmentId: string) {
    return rubrics.find((r) => r.assignmentId === assignmentId) ?? null;
  },
  async listPeople() {
    return [...teachers, ...students];
  },
  async getDeck(lessonId: string) {
    return decks[lessonId] ?? null;
  },
};
