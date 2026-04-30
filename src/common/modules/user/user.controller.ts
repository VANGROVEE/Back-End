import { ApiError } from "@/common/utils/api-error";
import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import type { UpdateUserDto } from "./user.dto";
import { userServices } from "./user.service";

export const userController = {
  findAll: catchAsync(async (req: Request, res: Response) => {
    const result = await userServices.findAll({
      select: userServices.userAdminSelect,
      
    });

    return sendResponse(res, 200, "Berhasil mengambil semua user", result);
  }),

  findOne: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Parameter ID wajib dikirim");

    const result = await userServices.findById(id as string);

    return sendResponse(res, 200, "User ditemukan", result);
  }),

  update: catchAsync(async (req: Request, res: Response) => { 
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Parameter ID wajib dikirim");

    const payload = req.body as UpdateUserDto;

    const result = await userServices.update(id as string, payload, {
      select: userServices.userUpdateSelect,
    });

    return sendResponse(res, 200, "User berhasil diperbarui", result);
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Parameter ID wajib dikirim");

    await userServices.delete(id as string);

    return sendResponse(res, 200, "User berhasil dihapus", null);
  }),
};
