import type { Request, Response } from "express";
import { dateUtils } from "@common/utils/date";
import { env } from "@config/env";

export const rootHandler = (req: Request, res: Response) => {
  const serverTime = dateUtils.formatNow("DD-MM-YYYY HH:mm:ss") + " WIB";

  res.status(200).json({
    success: true,
    message: "VANGGROVE API v1 Ready to use (❁´◡`❁) Happy Coding!",
    data: {
      status: "Online",
      environment: env.NODE_ENV,
      version: "1.0.0",
      serverTime: serverTime,
    },
  });
};
