import type { Request, Response } from "express";
import { dateUtils } from "@/common/utils/date";
import { env } from "@/common/config/env";
import { sendResponse } from "@/common/utils/response";

export const rootHandler = (req: Request, res: Response) => {
  const serverTime = dateUtils.formatNow("DD-MM-YYYY HH:mm:ss") + " WIB";

  return sendResponse(
    res,
    200,
    "VANGROVE API v1: System High & Ready to Deploy! 🚀",
    {
      status: "Online",
      environment: env.NODE_ENV,
      version: "1.0.0",
      api_base_url: `${req.protocol}://${req.get("host")}/api/v1`,
      server_time: serverTime,
      documentation: {
        swagger: `${req.protocol}://${req.get("host")}/docs`,
        postman:
          "https://web.postman.co/workspace/8cc5fdb9-d107-43fb-8656-4a34a7361ada/documentation/38246298-52b15395-abe4-482b-a83e-f4f8f81610db",
      },
      maintainer: {
        team: "Vangrove Dev Team",
        contact: "dev@vangrove.com",
      },
      dev_note:
        "Remember: Great farmers don't just plant seeds, they write clean code. Happy Coding, Cap! (❁´◡`❁)",
    },
  );
};
