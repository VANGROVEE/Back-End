import type { Response } from "express";

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T | null = null,
  isCache: boolean = false,
) => {
  res.setHeader("X-Cache", isCache ? "HIT" : "MISS");

  if (isCache) {
    res.setHeader("Cache-Control", "public, max-age=3600");
  }
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data,
  });
};
  