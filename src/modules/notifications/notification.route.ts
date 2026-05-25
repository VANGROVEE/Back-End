import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import type { Router } from "express";
import { notificationController } from "./notification.controller";
import './notification.docs'

export default (router: Router, prefix: string) => {
  router.get(prefix, authenticate, notificationController.getAll);

  router.get(
    `${prefix}/unread-count`,

    authenticate,
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
