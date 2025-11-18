import type { ContentService } from '@/services/contracts';

export const liveContent: ContentService = {
  async listLessons(courseId: string) {
    throw new Error('liveContent.listLessons not implemented');
  },
  async listNotes(courseId: string) {
    throw new Error('liveContent.listNotes not implemented');
  },
  async getNote(noteId: string) {
    throw new Error('liveContent.getNote not implemented');
  },
  async getRubric(assignmentId: string) {
    throw new Error('liveContent.getRubric not implemented');
  },
  async listPeople() {
    throw new Error('liveContent.listPeople not implemented');
  },
  async getDeck(lessonId: string) {
    throw new Error('liveContent.getDeck not implemented');
  },
  async createNoteWithAttachment(courseId, lessonId, file) {
    throw new Error('liveContent.createNoteWithAttachment not implemented');
  },
  async deleteNote(noteId: string) {
    throw new Error('liveContent.deleteNote not implemented');
  },
  async updateLesson(lessonId: string, patch: { title?: string; about?: string; coverUrl?: string; completed?: boolean }) {
    throw new Error('liveContent.updateLesson not implemented');
  },
  async uploadLessonImage(lessonId: string, file: { uri: string; name?: string; type?: string }) {
    throw new Error('liveContent.uploadLessonImage not implemented');
  },
  async deleteLessonImage(lessonId: string) {
    throw new Error('liveContent.deleteLessonImage not implemented');
  },
};
