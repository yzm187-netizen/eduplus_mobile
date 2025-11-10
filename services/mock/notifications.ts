import type { NotificationService } from '@/services/contracts';
import { notifications } from '@/data/sample';

export const mockNotifications: NotificationService = {
  async list() {
    return notifications;
  },
};
