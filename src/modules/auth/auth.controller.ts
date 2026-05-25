import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import type { LoginDto, RegisterAuhtDto } from "./auth.dto";
import { authService } from "./auth.service";

export const authController = {
  login: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body as LoginDto;
    const result = await authService.login(payload);

    return sendResponse(res, 201, "Login Berhasil", result);
  }),

  register: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body as RegisterAuhtDto;
    const result = await authService.register(payload);

    return sendResponse(res, 201, "Registrasi akun berhasil", result);
  }),
};
