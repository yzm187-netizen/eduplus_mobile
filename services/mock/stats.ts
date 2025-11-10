import type { StatsService } from '@/services/contracts';
import { overview } from '@/data/sample';

export const mockStats: StatsService = {
  async getStudentOverview() {
    return overview;
  },
};
