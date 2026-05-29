import { ApiError } from "@/common/utils/api-error";
import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import { commodityService } from "./comodity.service";

export const commodityController = {
  findAll: catchAsync(async (req: Request, res: Response) => {
    const result = await commodityService.findAll({
      orderBy: { name: "desc" },
    });

    return sendResponse(
      res,
      200,
      "Berhasil mengambil semua data komoditas",
      result,
    );
  }),

  findOne: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "ID Komoditas wajib dikirim");

    const result = await commodityService.findById(id as string);

    return sendResponse(res, 200, "Data komoditas ditemukan", result);
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;

    if (!id) throw new ApiError(400, "ID Komoditas wajib dikirim");

    const result = await commodityService.update(id as string, payload);

    return sendResponse(res, 200, "Komoditas berhasil diperbarui", result);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "ID Komoditas wajib dikirim");

    await commodityService.delete(id as string);

    return sendResponse(res, 200, "Komoditas berhasil dihapus", null);
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;

    const result = await commodityService.create(payload);

    return sendResponse(res, 201, "Komoditas berhasil ditambahkan", result);
  }),
  uploadExcel: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, "File Excel wajib diunggah");
    }

    const result = await commodityService.uploadCommodities(req.file.buffer);

    return sendResponse(
      res,
      201,
      "Data Excel berhasil diimpor ke Komoditas",
      result,
    );
  }),

  getStats: catchAsync(async (req: Request, res: Response) => {
    const result = await commodityService.getStats();

    return sendResponse(
      res,
      200,
      "Berhasil mengambil semua data Statistik komoditas",
      result,
    );
  }),
};
