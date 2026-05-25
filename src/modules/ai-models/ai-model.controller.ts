import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { NextFunction, Request, Response } from "express";
import { aiModelService } from "./ai-model.service";

export const aiModelController = {
  predictOnly: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { image_url } = req.body;

      const prediction = await aiModelService.predictOnly(image_url);

      return sendResponse(
        res,
        200,
        "Analisis AI berhasil didapatkan.",
        prediction,
      );
    },
  ),

  predictPlantDisease: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { cycle_id, image_url, image_key, notes, ai_raw_result } = req.body;

      // Menggunakan saveHealthReport yang baru direfaktorisasi
      const healthReport = await aiModelService.saveHealthReport({
        cycle_id,
        image_url,
        image_key,
        notes,
        ai_raw_result, // Hasil preview yang dikirim balik oleh FE
      });

      return sendResponse(
        res,
        201,
        "Laporan kesehatan tanaman berhasil disimpan.",
        healthReport,
      );
    },
  ),
};
