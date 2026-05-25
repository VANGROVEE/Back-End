import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { notificationService } from "./notification.service";

export const notificationController = {
  getAll: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.sub;
    const data = await notificationService.getByUserId(userId);

    return sendResponse(res, 200, "Notifikasi berhasil diambil", data);
  }),

  getUnreadCount: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.sub;
    const count = await notificationService.getUnreadCount(userId);

    return sendResponse(res, 200, "Jumlah unread berhasil dihitung", { count });
  }),

  markAsRead: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.sub;
    const { id } = req.params as { id: string };

    const data = await notificationService.markAsRead(id, userId);
    return sendResponse(res, 200, "Notifikasi ditandai telah dibaca", data);
  }),

  markAllAsRead: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.sub;

    const data = await notificationService.markAllAsRead(userId);
    return sendResponse(
      res,
      200,
      "Semua notifikasi ditandai telah dibaca",
      data,
    );
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.sub;
    const { id } = req.params as { id: string };

    await notificationService.deleteNotification(id, userId);
    return sendResponse(res, 200, "Notifikasi berhasil dihapus", null);
  }),

  deleteAll: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.sub;

    await notificationService.deleteAll(userId);
    return sendResponse(res, 200, "Kotak masuk notifikasi dibersihkan", null);
  }),
};
