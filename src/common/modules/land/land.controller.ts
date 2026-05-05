import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { landService } from "./land.service";

export const landController = {
  create: catchAsync(async (req: Request, res: Response) => {
    const ownerId = req.user.sub;
    const payload = { ...req.body, owner_id: ownerId };

    const data = await landService.createLand(ownerId, payload);
    return sendResponse(res, 201, "Lahan Berhasil Ditambahkan!", data);
  }),

  getAll: catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.sub;
    const data = await landService.findAll({
      where: { owner_id: userId },
      orderBy: { created_at: "desc" },
    });
    return sendResponse(res, 200, "Daftar Lahan Berhasil Diambil", data);
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await landService.findById(id);
    return sendResponse(res, 200, "Detail Lahan Berhasil Diambil", data);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const updateData = req.body;

    const data = await landService.update(id, updateData);
    return sendResponse(res, 200, "Data Lahan Berhasil Diperbarui", data);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await landService.delete(id);
    return sendResponse(res, 200, "Lahan Berhasil Dihapus", null);
  }),
};
