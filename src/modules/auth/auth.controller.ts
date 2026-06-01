import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { Request, Response } from "express";
import type { LoginDto, RegisterAuhtDto } from "./auth.dto";
import { authService } from "./auth.service";

export const authController = {
  getMe: catchAsync(async (req: Request, res: Response) => {
    const token =
      req.cookies.be_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return sendResponse(res, 401, "Sesi tidak ditemukan", null);
    }

    const result = await authService.getMe(token);

    return sendResponse(res, 200, "Data user berhasil diambil", result);
  }),
  googleLogin: catchAsync(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      return sendResponse(res, 400, "Google ID Token diperlukan", null);
    }

    const result = await authService.googleLogin(idToken);

    return sendResponse(res, 200, "Login Google Berhasil", result);
  }),
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
