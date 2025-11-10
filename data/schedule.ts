export type Session = {
  id: string;
  courseId: string;
  title: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
};

export type Exam = {
  id: string;
  courseId: string;
  title: string;
  startsAt: string; // ISO
  endsAt: string; // ISO
};

export type CalendarItem =
  | ({ type: 'session' } & Session)
  | ({ type: 'exam' } & Exam)
  | ({ type: 'assignment' } & { id: string; courseId: string; title: string; dueAt: string });

// Simple mock sessions/exams around assignment dates
export const sessions: Session[] = [
  { id: 'sess-eng201-1', courseId: 'c-eng201', title: 'ENG 201 Lecture', startsAt: '2025-11-03T15:00:00Z', endsAt: '2025-11-03T16:00:00Z' },
  { id: 'sess-cs305-1', courseId: 'c-cs305', title: 'CS 305 Studio', startsAt: '2025-11-10T09:00:00Z', endsAt: '2025-11-10T10:30:00Z' },
  { id: 'sess-math220-1', courseId: 'c-math220', title: 'MATH 220 Seminar', startsAt: '2025-11-07T13:00:00Z', endsAt: '2025-11-07T14:00:00Z' },
];

export const exams: Exam[] = [
  { id: 'exam-math220-mid', courseId: 'c-math220', title: 'Midterm', startsAt: '2025-11-09T14:00:00Z', endsAt: '2025-11-09T16:00:00Z' },
];
