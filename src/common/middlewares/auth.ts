import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { supabase } from "../lib/supabase";
import { ApiError } from "../utils/api-error";
import { catchAsync } from "../utils/express-async-errors";

export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(
        401,
        "Sesi tidak ditemukan, silakan login terlebih dahulu",
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Format token salah!");
    }

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      throw new ApiError(401, "Sesi tidak valid atau telah kadaluwarsa");
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Profil user tidak ditemukan di database");
    }

    req.user = {
      sub: user.id,
      name: user.name,
      email: authUser.email as string,
      role: user.role,
    };

    next();
  },
);
