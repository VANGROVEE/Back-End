import { ApiError } from "@/common/utils/api-error";
import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { createPlantingCycleSchema } from "./planting-cycle.dto";
import { plantingCycleService } from "./planting-cycles.service";

export const plantingCycleController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const { body } = createPlantingCycleSchema.parse({ body: req.body });

    const result = await plantingCycleService.create(body);

    return sendResponse(res, 201, "Siklus tanam berhasil diregistrasi", result);
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

    const result = await plantingCycleService.findById(id as string);

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
