export type Thread = {
  id: string;
  title: string;
  courseId?: string;
  members: string[]; // user ids
  lastMessageAt: string; // ISO
};

export type Message = {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string; // ISO
  context?: { assignmentId?: string; sectionKey?: string; taskId?: string; sectionTitle?: string; taskTitle?: string };
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  name: string;
  url: string; // remote URL for mock/live; local file URIs not yet supported in Expo Go preview
  mimeType?: string;
  sizeBytes?: number;
};

export const threads: Thread[] = [
  { id: 't-1', title: 'ENG 201 · Assignment tips', courseId: 'c-eng201', members: ['u-student-1', 'u-teacher-1'], lastMessageAt: '2025-10-29T12:30:00Z' },
  { id: 't-2', title: 'CS 305 · Team Alpha', courseId: 'c-cs305', members: ['u-student-1', 'u-student-2', 'u-student-3'], lastMessageAt: '2025-10-29T12:45:00Z' },
];

export const messages: Message[] = [
  { id: 'm-1', threadId: 't-1', authorId: 'u-teacher-1', authorName: 'Prof. Lee', text: 'Reminder: prototype due next week!', createdAt: '2025-10-29T12:20:00Z' },
  { id: 'm-2', threadId: 't-1', authorId: 'u-student-1', authorName: 'You', text: 'Thanks for the heads up!', createdAt: '2025-10-29T12:30:00Z' },
  { id: 'm-3', threadId: 't-2', authorId: 'u-student-2', authorName: 'Ava', text: 'Pushing new Figma frames now.', createdAt: '2025-10-29T12:40:00Z' },
  { id: 'm-4', threadId: 't-2', authorId: 'u-student-1', authorName: 'You', text: 'I will test on device later.', createdAt: '2025-10-29T12:45:00Z' },
];
