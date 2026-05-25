import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { healthService } from "./health.service";

export const healthController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const data = await healthService.create(payload);
    return sendResponse(res, 201, "Laporan kesehatan berhasil dibuat!", data);
  }),

  getAll: catchAsync(async (req: Request, res: Response) => {
    const rawCycleId = req.query.cycle_id;
    console.log(rawCycleId);

    const cycle_id = typeof rawCycleId === "string" ? rawCycleId : undefined;
    const data = await healthService.findAll({
      where: cycle_id ? { cycle_id: cycle_id } : undefined,
      orderBy: { created_at: "desc" },
    });

    return sendResponse(
      res,
      200,
      `Daftar laporan kesehatan berhasil diambil${cycle_id ? ` dengan cycle id ${cycle_id}` : ""}`,
      data,
    );
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await healthService.findById(id);
    return sendResponse(
      res,
      200,
      "Detail laporan kesehatan berhasil diambil",
      data,
    );
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const updateData = req.body;

    const data = await healthService.update(id, updateData);
    return sendResponse(
      res,
      200,
      "Laporan kesehatan berhasil diperbarui",
      data,
    );
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await healthService.delete(id);
    return sendResponse(res, 200, "Laporan kesehatan berhasil dihapus", null);
  }),
};
