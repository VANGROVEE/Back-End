import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import type { Notification } from "@/generated/prisma/client";

class NotificationService extends BaseService<
  Notification,
  typeof prisma.notification
> {
  constructor() {
    super(prisma.notification);
  }

  async getByUserId(userId: string) {
    return await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });
  }

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        user_id: userId,
      },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.delete({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });
  }

  async deleteAll(userId: string) {
    return await prisma.notification.deleteMany({
      where: {
        user_id: userId,
      },
    });
  }
}

export const notificationService = new NotificationService();
