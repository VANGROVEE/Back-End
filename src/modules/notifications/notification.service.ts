import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { cacheHelper } from "@/common/utils/cache";
import type { Notification } from "@/generated/prisma/client";

class NotificationService extends BaseService<
  Notification,
  typeof prisma.notification
> {
  private getNotificationKeys(userId: string) {
    return {
      list: `notifications:list:${userId}`,
      unread: `notifications:unread_count:${userId}`,
    };
  }

  constructor() {
    super(prisma.notification, "notifications");
  }

  /** Helper internal untuk membersihkan cache khusus milik satu user */
  private async invalidateUserCache(userId: string) {
    const keys = this.getNotificationKeys(userId);
    await cacheHelper.delete([keys.list, keys.unread]);

    await this.invalidateCache();
  }

  async getByUserId(userId: string) {
    const cacheKey = this.getNotificationKeys(userId).list;

    return cacheHelper.getOrSet(
      cacheKey,
      async () => {
        return await prisma.notification.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        });
      },
      300,
    );
  }

  async getUnreadCount(userId: string) {
    const cacheKey = this.getNotificationKeys(userId).unread;

    return cacheHelper.getOrSet(
      cacheKey,
      async () => {
        return await prisma.notification.count({
          where: {
            user_id: userId,
            is_read: false,
          },
        });
      },
      600,
    );
  }

  async markAsRead(notificationId: string, userId: string) {
    const result = await prisma.notification.update({
      where: {
        id: notificationId,
        user_id: userId,
      },
      data: { is_read: true },
    });

    await this.invalidateUserCache(userId);
    return result;
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });

    await this.invalidateUserCache(userId);
    return result;
  }

  async deleteNotification(notificationId: string, userId: string) {
    const result = await prisma.notification.delete({
      where: {
        id: notificationId,
        user_id: userId,
      },
    });

    await this.invalidateUserCache(userId);
    return result;
  }

  async deleteAll(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: {
        user_id: userId,
      },
    });

    await this.invalidateUserCache(userId);
    return result;
  }
}

export const notificationService = new NotificationService();
