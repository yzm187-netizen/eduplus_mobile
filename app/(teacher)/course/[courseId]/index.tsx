import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Redirect /(teacher)/course/[courseId] to /(teacher)/course/[courseId]/overview
export default function TeacherCourseIndexRedirect() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (courseId) router.replace((`/(teacher)/course/${courseId}/overview` as any));
  }, [courseId, router]);

  return null;
}

