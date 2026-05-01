import { ApiError } from "@/common/utils/api-error";
import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { dailyActivityService } from "./daily-activity.service";

export const dailyActivityController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    const result = await dailyActivityService.createActivity(payload);

    return sendResponse(res, 201, "Aktivitas harian berhasil dicatat", result);
  }),

  findAll: catchAsync(async (req: Request, res: Response) => {
    const result = await dailyActivityService.findAll({
      include: {
        cycle: {
          select: {
            commodity_name: true,
            status: true,
          },
        },
      },
    });

    return sendResponse(
      res,
      200,
      "Daftar aktivitas harian berhasil diambil",
      result,
    );
  }),

  findOne: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "ID aktivitas harian wajib diisi");

    const result = await dailyActivityService.findById(id as string);

    if (!result) throw new ApiError(404, "Aktivitas harian tidak ditemukan");

    return sendResponse(res, 200, "Detail aktivitas harian ditemukan", result);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "ID aktivitas harian wajib diisi");

    const payload = req.body;
    const result = await dailyActivityService.update(id as string, payload);

    return sendResponse(
      res,
      200,
      "Aktivitas harian berhasil diperbarui",
      result,
    );
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "ID aktivitas harian wajib diisi");

    await dailyActivityService.delete(id as string);

    return sendResponse(res, 200, "Aktivitas harian berhasil dihapus", null);
  }),
};
