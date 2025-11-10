import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Redirect /course/[courseId] to /course/[courseId]/overview
export default function CourseIndexRedirect() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (courseId) router.replace((`/(student)/course/${courseId}/overview` as any));
  }, [courseId, router]);

  return null;
}
