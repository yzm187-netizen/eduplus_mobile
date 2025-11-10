import { GroupsService } from '@/services/contracts';

let groupsByCourse: Record<string, Array<{ id: string; name: string; members: Array<{ id: string; name: string }> }>> = {
  'c-eng201': [
    { id: 'g-1', name: 'Group A', members: [ { id: 'u-student-1', name: 'You' }, { id: 'u-student-2', name: 'Ava' } ] },
  ],
};

export const mockGroups: GroupsService = {
  async list(courseId: string) {
    return (groupsByCourse[courseId] || []).map(g => ({ id: g.id, name: g.name, members: g.members.length }));
  },
  async get(groupId: string) {
    for (const courseId of Object.keys(groupsByCourse)) {
      const g = groupsByCourse[courseId].find(gr => gr.id === groupId);
      if (g) return g;
    }
    return null;
  },
};
