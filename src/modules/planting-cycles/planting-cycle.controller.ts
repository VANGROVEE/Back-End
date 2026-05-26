import { ApiError } from "@/common/utils/api-error";
import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";

import {
  createPlantingCycleSchema,
  updatePlantingCycleSchema,
} from "./planting-cycle.dto";
import { plantingCycleService } from "./planting-cycles.service";

export const plantingCycleController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const { body } = createPlantingCycleSchema.parse({ body: req.body });

    const result = await plantingCycleService.createCycle(body);

    return sendResponse(res, 201, "Siklus tanam berhasil diregistrasi", result);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { body } = updatePlantingCycleSchema.parse({ body: req.body });

    const result = await plantingCycleService.updateCycle(id as string, body);

    return sendResponse(res, 200, "Siklus tanam berhasil diperbarui", result);
  }),

  getHeatmapCalendar: catchAsync(async (req: Request, res: Response) => {
    const { cycle_id } = req.query;

    const result = await plantingCycleService.getHeatmapCalendar(
      cycle_id as string,
    );

    return sendResponse(
      res,
      200,
      "Data heatmap kalender berhasil diambil",
      result,
    );
  }),

  getCycleSummary: catchAsync(async (req: Request, res: Response) => {
    const { cycle_id } = req.query as { cycle_id: string };

    const result = await plantingCycleService.getCycleSummary(cycle_id);

    return sendResponse(
      res,
      200,
      "Ringkasan laporan siklus tanam berhasil dibuat.",
      result,
    );
  }),

  findAll: catchAsync(async (req: Request, res: Response) => {
    const user = req.user;

    const result = await plantingCycleService.findAll({
      where: {
        land: {
          owner_id: user.sub,
        },
      },
      include: {
        land: {
          select: {
            name: true,
            location: true,
          },
        },
      },
    });

    return sendResponse(
      res,
      200,
      "Daftar siklus tanam berhasil diambil",
      result,
    );
  }),

  findOne: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "ID siklus tanam wajib diisi");

    const result = await plantingCycleService.findById(id as string, {
      include: { commodity: true, daily_activities: true },
    });

    if (!result) throw new ApiError(404, "Siklus tanam tidak ditemukan");

    return sendResponse(res, 200, "Detail siklus tanam ditemukan", result);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "ID siklus tanam wajib diisi");

    await plantingCycleService.delete(id as string);

    return sendResponse(res, 200, "Siklus tanam berhasil dihapus", null);
  }),
};
