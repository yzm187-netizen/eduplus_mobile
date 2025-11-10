// Academic mock data: people, lessons, notes, enrollments, and rubrics

export type Program = 'Diploma UX Design' | 'BSc Computer Science';

export type Person = {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  program?: Program; // for students only
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  order: number;
};

export type Note = {
  id: string;
  courseId: string;
  lessonId: string;
  authorId: string; // teacher or student
  visibility: 'course' | 'group' | 'private';
  title: string;
  content: string; // markdown/plain text for now
  createdAt: string; // ISO
};

export type Enrollment = {
  courseId: string;
  userId: string;
  role: 'student' | 'teacher';
};

export type Rubric = {
  assignmentId: string;
  title: string;
  criteria: Array<{
    name: string;
    levels: Array<{ label: string; points: number; description?: string }>;
  }>;
  totalPoints: number;
};

// People
export const teachers: Person[] = [
  { id: 't-alex', name: 'Alex Chen', role: 'teacher' },
  { id: 't-samara', name: 'Samara Patel', role: 'teacher' },
];

export const students: Person[] = [
  { id: 's-ava', name: 'Ava Lim', role: 'student', program: 'Diploma UX Design' },
  { id: 's-noah', name: 'Noah Reyes', role: 'student', program: 'Diploma UX Design' },
  { id: 's-olivia', name: 'Olivia Wang', role: 'student', program: 'BSc Computer Science' },
  { id: 's-liam', name: 'Liam Kaur', role: 'student', program: 'BSc Computer Science' },
];

// Enrollments: keep cohorts consistent by program per course
export const enrollments: Enrollment[] = [
  // ENG 201 (general; use CS program cohort here to avoid mixing with UX-only courses)
  { courseId: 'c-eng201', userId: 't-alex', role: 'teacher' },
  { courseId: 'c-eng201', userId: 's-olivia', role: 'student' },
  { courseId: 'c-eng201', userId: 's-liam', role: 'student' },

  // CS 305 (HCI) – Diploma UX Design cohort
  { courseId: 'c-cs305', userId: 't-samara', role: 'teacher' },
  { courseId: 'c-cs305', userId: 's-ava', role: 'student' },
  { courseId: 'c-cs305', userId: 's-noah', role: 'student' },

  // MATH 220 – BSc CS cohort
  { courseId: 'c-math220', userId: 't-alex', role: 'teacher' },
  { courseId: 'c-math220', userId: 's-olivia', role: 'student' },
  { courseId: 'c-math220', userId: 's-liam', role: 'student' },
];

// Lessons
export const lessons: Lesson[] = [
  { id: 'l-eng201-1', courseId: 'c-eng201', title: 'Understanding Literature Reviews', order: 1 },
  { id: 'l-eng201-2', courseId: 'c-eng201', title: 'Citation and Academic Integrity', order: 2 },
  { id: 'l-cs305-1', courseId: 'c-cs305', title: 'User Research Fundamentals', order: 1 },
  { id: 'l-cs305-2', courseId: 'c-cs305', title: 'Prototyping Best Practices', order: 2 },
  { id: 'l-math220-1', courseId: 'c-math220', title: 'Descriptive Statistics', order: 1 },
  { id: 'l-math220-2', courseId: 'c-math220', title: 'Hypothesis Testing', order: 2 },
];

// Notes: teacher vs student authored; visibility controls
export const notes: Note[] = [
  // ENG 201 teacher note
  {
    id: 'n-eng201-1',
    courseId: 'c-eng201',
    lessonId: 'l-eng201-1',
    authorId: 't-alex',
    visibility: 'course',
    title: 'Structuring Your Literature Review',
    content: `# Structuring Your Literature Review\n\nUse a funnel approach: start broad, narrow to recent and relevant works.\n- Synthesize, don't summarize\n- Identify gaps\n- Motivate your approach\n\nReferences: APA 7th.`,
    createdAt: new Date('2025-10-10T09:00:00Z').toISOString(),
  },
  // CS 305 teacher note
  {
    id: 'n-cs305-1',
    courseId: 'c-cs305',
    lessonId: 'l-cs305-1',
    authorId: 't-samara',
    visibility: 'course',
    title: 'Interview Guide Template',
    content: `## Interview Guide\n\n1. Warm-up questions\n2. Task-based prompts\n3. Probing for pain points\n\nRemember: avoid leading questions.`,
    createdAt: new Date('2025-10-12T10:00:00Z').toISOString(),
  },
  // Student note visible to course (UX cohort)
  {
    id: 'n-cs305-2',
    courseId: 'c-cs305',
    lessonId: 'l-cs305-2',
    authorId: 's-ava',
    visibility: 'course',
    title: 'Prototype Heuristics (cheatsheet)',
    content: `- Visibility of system status\n- Match with real world\n- User control & freedom\n- Consistency & standards`,
    createdAt: new Date('2025-10-20T14:30:00Z').toISOString(),
  },
  // Private student note (only author sees)
  {
    id: 'n-math220-1',
    courseId: 'c-math220',
    lessonId: 'l-math220-1',
    authorId: 's-liam',
    visibility: 'private',
    title: 'Cheat Sheet: Mean vs Median',
    content: `Median is robust to outliers; mean is sensitive. Prefer median for skewed distributions.`,
    createdAt: new Date('2025-10-16T08:45:00Z').toISOString(),
  },
];

// Rubrics per assignment
export const rubrics: Rubric[] = [
  {
    assignmentId: 'a-lit-review',
    title: 'Literature Review Rubric',
    criteria: [
      {
        name: 'Synthesis & Structure',
        levels: [
          { label: 'Exemplary', points: 10, description: 'Clear synthesis, logical flow, well-organized.' },
          { label: 'Proficient', points: 8 },
          { label: 'Developing', points: 6 },
          { label: 'Beginning', points: 4 },
        ],
      },
      {
        name: 'Citations & Sources',
        levels: [
          { label: 'Exemplary', points: 10, description: 'APA 7th, current and relevant sources.' },
          { label: 'Proficient', points: 8 },
          { label: 'Developing', points: 6 },
          { label: 'Beginning', points: 4 },
        ],
      },
    ],
    totalPoints: 20,
  },
  {
    assignmentId: 'a-proto',
    title: 'Prototype v1 Rubric',
    criteria: [
      {
        name: 'Usability Heuristics',
        levels: [
          { label: 'Exemplary', points: 10 },
          { label: 'Proficient', points: 8 },
          { label: 'Developing', points: 6 },
          { label: 'Beginning', points: 4 },
        ],
      },
      {
        name: 'Design Consistency',
        levels: [
          { label: 'Exemplary', points: 10 },
          { label: 'Proficient', points: 8 },
          { label: 'Developing', points: 6 },
          { label: 'Beginning', points: 4 },
        ],
      },
    ],
    totalPoints: 20,
  },
  {
    assignmentId: 'a-stat-3',
    title: 'Statistics Assignment 3 Rubric',
    criteria: [
      {
        name: 'Method Correctness',
        levels: [
          { label: 'Exemplary', points: 10 },
          { label: 'Proficient', points: 8 },
          { label: 'Developing', points: 6 },
          { label: 'Beginning', points: 4 },
        ],
      },
      {
        name: 'Interpretation',
        levels: [
          { label: 'Exemplary', points: 10 },
          { label: 'Proficient', points: 8 },
          { label: 'Developing', points: 6 },
          { label: 'Beginning', points: 4 },
        ],
      },
    ],
    totalPoints: 20,
  },
];
