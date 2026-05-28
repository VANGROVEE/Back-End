import { ApiError } from "@/common/utils/api-error";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { dashboardAnalyzeService } from "./dashboard.service";

export const dashboardAnalyzeController = {
  async getSpatialAnalysis(req: Request, res: Response) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Sesi kadaluwarsa, silakan login kembali");
    }

    const analysisData =
      await dashboardAnalyzeService.getSpatialAnalysis(userId);

    return sendResponse(
      res,
      200,
      "Analisis spasial berhasil dihitung",
      analysisData,
    );
  },

  async getHealth(req: Request, res: Response) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Sesi kadaluwarsa, silakan login kembali");
    }

    const healthData = await dashboardAnalyzeService.getHealthAnalysis(userId);

    return sendResponse(
      res,
      200,
      "Laporan kesehatan AI berhasil dimuat",
      healthData,
    );
  },
};
