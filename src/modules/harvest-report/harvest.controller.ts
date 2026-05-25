import { ApiError } from "@/common/utils/api-error";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { harvestReportService } from "./harvest.service";

export const harvestReportController = {
  async getDashboardData(req: Request, res: Response) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new ApiError(401, "Sesi kadaluwarsa, silakan login kembali");
    }

    // 🌟 Cukup satu panggil, karena service sudah melakukan Promise.all secara internal
    const dashboardData = await harvestReportService.getDashboardData(userId);

    return sendResponse(
      res,
      200,
      "Data laporan panen berhasil diambil",
      dashboardData,
    );
  },

  async create(req: Request, res: Response) {
    const data = req.body;
    const newReport = await harvestReportService.create(data);
    return sendResponse(res, 201, "Laporan panen berhasil dibuat", newReport);
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const report = await harvestReportService.findById(id);

    if (!report) {
      throw new ApiError(404, "Laporan tidak ditemukan");
    }

    return sendResponse(res, 200, "Detail laporan berhasil diambil", report);
  },
};
