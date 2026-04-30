import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/api-error";
import { catchAsync } from "../utils/express-async-errors";
import { verifyJwt } from "../utils/jwt";

export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(
        401,
        "sesi tidak ditemukan, silahkan login terlebih dahulu",
      );
    }
    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Format token salah!");
    }
    const decode = await verifyJwt(token);
    const user = await prisma.user.findUnique({
      where: { id: decode.sub },
      select: {
        id: true,
        name: true,
        auth_credentials: { select: { email: true, role: true } },
      },
    });

    if (!user || !user.auth_credentials) {
      throw new ApiError(401, "User sudah tidak aktif atau tidak ditemukan");
    }

    req.user = {
      sub: user.id,
      name: user.name,
      email: user.auth_credentials?.email,
      role: user.auth_credentials?.role,
    };
    next();
  },
);
