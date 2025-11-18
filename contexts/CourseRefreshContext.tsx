import React from 'react';

export type CourseRefreshContextValue = {
  courseId: string;
  refreshNonce: number;
};

export const CourseRefreshContext = React.createContext<CourseRefreshContextValue | null>(null);
