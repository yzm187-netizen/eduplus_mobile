import type { GroupsService } from '@/services/contracts';

export const liveGroups: GroupsService = {
  async list(courseId: string) {
    throw new Error('liveGroups.list not implemented');
  },
  async get(groupId: string) {
    throw new Error('liveGroups.get not implemented');
  },
};
