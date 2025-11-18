import type { PeopleService } from '@/services/contracts';

export const livePeople: PeopleService = {
  async listCoursePeople(courseId: string) {
    throw new Error('livePeople.listCoursePeople not implemented');
  },
};
