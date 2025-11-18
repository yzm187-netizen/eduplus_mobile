import type { NotificationService } from '@/services/contracts';

export const liveNotifications: NotificationService = {
  async list() {
    throw new Error('liveNotifications.list not implemented');
  },
};
