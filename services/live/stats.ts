import type { StatsService } from '@/services/contracts';

export const liveStats: StatsService = {
  async getStudentOverview() {
    throw new Error('liveStats.getStudentOverview not implemented');
  },
};
