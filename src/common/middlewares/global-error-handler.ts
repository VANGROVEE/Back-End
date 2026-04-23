import { env } from "@config/env";
import { logger } from "@config/pino";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

interface AppError extends Error {
  statusCode?: number;
  status?: number;
  isOperational?: boolean;
  code?: string;
  detail?: string;
  issues?: unknown;
  details?: unknown;
  isJoi?: boolean;
}

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = err as AppError;

  const statusCode = error.statusCode || error.status || 500;
  const isInternalError = statusCode >= 500;

  if (isInternalError) {
    logger.error({
      msg: "INTERNAL_SERVER_ERROR",
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      status: "failed",
      type: "BAD_REQUEST",
      message: "Format JSON tidak valid atau Body kosong!",
    });
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      status: "failed",
      type: "VALIDATION_ERROR",
      message: "Validasi gagal pada beberapa field",

      errors: formattedErrors,
    });
  }

  if (error.code) {
    const dbErrors: Record<
      string,
      { status: number; type: string; msg: string }
    > = {
      "23505": {
        status: 409,
        type: "UNIQUE_VIOLATION",
        msg: "Data sudah ada (Duplikat).",
      },
      "23503": {
        status: 400,
        type: "FOREIGN_KEY_VIOLATION",
        msg: "Data relasi tidak ditemukan.",
      },
      "22P02": {
        status: 400,
        type: "INVALID_FORMAT",
        msg: "Format data tidak sesuai.",
      },
    };

    const dbErr = dbErrors[error.code];
    if (dbErr) {
      return res.status(dbErr.status).json({
        success: false,
        status: "failed",
        type: dbErr.type,
        message: dbErr.msg,
        detail: error.detail,
      });
    }
  }

  const isOperational = error.isOperational || statusCode < 500;

  if (isOperational) {
    return res.status(statusCode).json({
      success: false,
      status: "failed",
      type: error.name === "Error" ? "APP_ERROR" : error.name,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    status: "error",
    type: "INTERNAL_SERVER_ERROR",
    message: "Terjadi Kesalahan Pada Server. Silahkan Coba Lagi Nanti!",
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
