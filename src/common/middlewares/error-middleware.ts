import { env } from "@config/env";
import { logger } from "@config/pino";
import type { NextFunction, Request, Response } from "express";
import type { AppError } from "../types/error";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = err as AppError;

  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || "Internal Server Error";

  logger.error({
    method: req.method,
    url: req.url,
    status: statusCode,
    error: message,

    stack: env.NODE_ENV === "development" ? error.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message:
      statusCode >= 500 && env.NODE_ENV === "production"
        ? "Internal Server Error"
        : message,

    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
