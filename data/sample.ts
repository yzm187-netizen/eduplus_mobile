// Lightweight sample data for UI-only development (no backend calls)
// Keep shapes close to what services will eventually return

export type Course = {
  id: string;
  code: string;
  name: string;
  color?: string;
  badges?: {
    newNotes?: number;
    newGrades?: number;
  };
};

export type AssignmentRef = {
  id: string;
  courseId: string;
  title: string;
  dueAt: string; // ISO
  description?: string; // long description (teacher-editable in future)
  createdAt?: string; // ISO
};

export type Notification =
  | {
      id: string;
      type: 'assignment_due' | 'assignment_graded' | 'announcement' | 'resource_added';
      title: string;
      subtitle?: string;
      courseId?: string;
      assignmentId?: string;
      createdAt: string; // ISO
      badges?: number; // numeric badge count when applicable
    };

export const courses: Course[] = [
  { id: 'c-eng201', code: 'ENG 201', name: 'Academic Writing', color: '#10b981', badges: { newNotes: 2 } },
  { id: 'c-cs305', code: 'CS 305', name: 'Human-Computer Interaction', color: '#6366f1', badges: { newGrades: 1 } },
  { id: 'c-math220', code: 'MATH 220', name: 'Statistics', color: '#f59e0b' },
];

export const assignments: AssignmentRef[] = [
  {
    id: 'a-lit-review',
    courseId: 'c-eng201',
    title: 'Literature Review',
    dueAt: '2025-11-05T15:00:00Z',
    createdAt: '2025-10-10T10:00:00Z',
    description:
      'Synthesize prior research into a clear, cohesive literature review. Emphasize gaps and how your work addresses them. Cite using APA 7th.\n\nDeliverables:\n- 1,500–2,000 words excluding references\n- Minimum 12 recent, relevant sources\n- Section outline: Introduction, Thematic Synthesis, Gaps & Motivations, Summary\n\nTips: Prioritize synthesis over summaries; group findings thematically; use recent meta-analyses when available. Include a figure or table if it clarifies structure.',
  },
  {
    id: 'a-proto',
    courseId: 'c-cs305',
    title: 'Prototype v1',
    dueAt: '2025-11-12T09:00:00Z',
    createdAt: '2025-10-18T09:30:00Z',
    description:
      'Create an interactive prototype that demonstrates your core flow. Focus on usability heuristics, consistency, and learnability.\n\nDeliverables:\n- Clickable prototype covering at least the happy path\n- 5 annotated screenshots highlighting key decisions\n- Heuristic self‑review (Nielsen’s 10) with 3+ actionable fixes\n\nTips: Prefer consistent spacing, color, and typography tokens. Keep interactions obvious; reduce cognitive load at each step.',
  },
  {
    id: 'a-stat-3',
    courseId: 'c-math220',
    title: 'Assignment 3',
    dueAt: '2025-11-08T23:59:00Z',
    createdAt: '2025-10-22T14:00:00Z',
    description:
      'Apply statistical methods to the provided dataset. Show your steps, justify choices, and interpret results clearly.\n\nDeliverables:\n- Notebook or step‑by‑step calculations\n- Cleaned dataset (or documented transformations)\n- 2–3 charts supporting your conclusions\n\nTips: Check assumptions before picking tests; explain why your method fits the question; include effect sizes, not just p‑values.',
  },
];

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'assignment_due',
    title: 'Literature Review due in 7 days',
    subtitle: 'ENG 201',
    courseId: 'c-eng201',
    assignmentId: 'a-lit-review',
    createdAt: '2025-10-29T09:00:00Z',
    badges: 1,
  },
  {
    id: 'n2',
    type: 'assignment_due',
    title: 'Prototype v1 due next week',
    subtitle: 'CS 305',
    courseId: 'c-cs305',
    assignmentId: 'a-proto',
    createdAt: '2025-10-29T09:10:00Z',
  },
  {
    id: 'n3',
    type: 'assignment_graded',
    title: 'Assignment 2 graded',
    subtitle: 'MATH 220',
    courseId: 'c-math220',
    createdAt: '2025-10-28T17:30:00Z',
    badges: 1,
  },
];

export const overview = {
  weeklyStudyHours: 12,
  assignmentsCompleted: 18,
  streakDays: 4,
};

export function dueSoonCount(withinDays = 7) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return assignments.filter((a) => new Date(a.dueAt) <= cutoff).length;
}
