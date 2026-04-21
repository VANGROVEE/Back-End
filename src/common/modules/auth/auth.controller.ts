import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import type { GoogleLoginDto, LoginDto, RegisterDto } from "./auth.dto";
import { authService } from "./auth.service";

export const authController = {
  authenticateGoogleUser: catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body as GoogleLoginDto;
    const result = await authService.authenticateGoogleUser(token);

    return sendResponse(res, 200, "Login Google Berhasil", result);
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body as LoginDto;
    const result = await authService.login(payload);

    return sendResponse(res, 200, "Login Berhasil", result);
  }),

  register: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body as RegisterDto;
    const result = await authService.register(payload);

    return sendResponse(res, 201, "Registrasi akun berhasil", result);
  }),
};
