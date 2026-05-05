import { Prisma } from "@/generated/prisma/client";
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
  meta?: any;
}

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = err as AppError;

  const statusCode = error.statusCode || error.status || 500;

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

  const isPrismaError =
    err instanceof Prisma.PrismaClientKnownRequestError ||
    (typeof error.code === "string" && error.code.startsWith("P"));

  if (isPrismaError && error.code) {
    const prismaCode = error.code;

    const prismaErrors: Record<
      string,
      { status: number; type: string; msg: string }
    > = {
      P2002: {
        status: 409,
        type: "UNIQUE_VIOLATION",
        msg: "Data sudah ada di sistem (Duplikat).",
      },
      P2003: {
        status: 400,
        type: "FOREIGN_KEY_VIOLATION",
        msg: "Gagal menyimpan karena relasi data tidak ditemukan.",
      },
      P2025: {
        status: 404,
        type: "NOT_FOUND",
        msg: "Data yang diminta tidak ditemukan.",
      },
    };

    const pErr = prismaErrors[prismaCode];

    if (pErr) {
      return res.status(pErr.status).json({
        success: false,
        status: "failed",
        type: pErr.type,
        message: pErr.msg,
        ...(env.NODE_ENV === "development" && { meta: error.meta }),
      });
    }
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
        msg: "Data relasi tidak ditemukan atau tidak valid.",
      },
      "23502": {
        status: 400,
        type: "NOT_NULL_VIOLATION",
        msg: "Ada kolom wajib yang kosong (Null).",
      },
      "23514": {
        status: 400,
        type: "CHECK_VIOLATION",
        msg: "Data tidak memenuhi syarat validasi database (Check Constraint).",
      },

      "22P02": {
        status: 400,
        type: "INVALID_FORMAT",
        msg: "Format tipe data tidak sesuai (misal: text dimasukkan ke kolom angka/UUID).",
      },
      "22001": {
        status: 400,
        type: "STRING_TOO_LONG",
        msg: "Karakter teks yang dimasukkan terlalu panjang untuk kolom ini.",
      },
      "22003": {
        status: 400,
        type: "NUMERIC_OUT_OF_RANGE",
        msg: "Angka yang dimasukkan terlalu besar atau di luar batas tipe data.",
      },

      "42P01": {
        status: 500,
        type: "UNDEFINED_TABLE",
        msg: "Tabel database tidak ditemukan.",
      },
      "42703": {
        status: 500,
        type: "UNDEFINED_COLUMN",
        msg: "Kolom database tidak ditemukan.",
      },

      "40P01": {
        status: 409,
        type: "DEADLOCK_DETECTED",
        msg: "Terjadi antrean proses database (Deadlock). Silahkan coba lagi.",
      },
    };

    const dbErr = dbErrors[error.code];
    if (dbErr) {
      return res.status(dbErr.status).json({
        success: false,
        status: "failed",
        type: dbErr.type,
        message: dbErr.msg,
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

  logger.error({
    msg: "INTERNAL_SERVER_ERROR",
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    status: "error",
    type: "INTERNAL_SERVER_ERROR",
    message: "Terjadi Kesalahan Pada Server. Silahkan Coba Lagi Nanti!",
    ...(env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
