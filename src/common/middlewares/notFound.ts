import createError from "http-errors";
import type { Request, Response, NextFunction } from "express";

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const message = `Resource [${req.method}] ${req.originalUrl} tidak ditemukan pada server Vanggrove ini.`;

  next(createError(404, message));
};
