import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
import { commonSchema } from "@/common/utils/schema";
import type { Router } from "express";
import { notificationController } from "./notification.controller";
import "./notification.docs";

export default (router: Router, prefix: string) => {
  router.get(
    prefix,
    authenticate,
    autoCache(300, true),
    notificationController.getAll,
  );

  router.get(
    `${prefix}/unread-count`,
    authenticate,
    autoCache(300, true),
    notificationController.getUnreadCount,
  );

  router.patch(
    `${prefix}/read-all`,
    authenticate,
    notificationController.markAllAsRead,
  );

  router.patch(
    `${prefix}/:id/read`,
    authenticate,
    validate(commonSchema.paramsId),
    notificationController.markAsRead,
  );

  router.delete(
    `${prefix}/all`,
    authenticate,
    notificationController.deleteAll,
  );

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    notificationController.delete,
  );
};
