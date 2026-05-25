import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { NextFunction, Request, Response } from "express";
import { analyticsService } from "./analytics.service";

export const analyticController = {
  usersActive: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await analyticsService.usersActive();

      return sendResponse(
        res,
        200,
        "Berhasil mengambil data pengguna aktif",
        data,
      );
    },
  ),

  aiPerformance: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await analyticsService.aiPerformance();

      return sendResponse(
        res,
        200,
        "Berhasil mengambil data performa AI",
        data,
      );
    },
  ),
};
