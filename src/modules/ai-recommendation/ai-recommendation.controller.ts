import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import type { NextFunction, Request, Response } from "express";
import { aiRecommendationService } from "./ai-recommendation.service";

export const aiRecommendationController = {
  getDailyRecommendation: catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const recommendation =
        await aiRecommendationService.generateDailyRecommendation(id as string);

      return sendResponse(
        res,
        200,
        "Rekomendasi AI berhasil di-generate berdasarkan analisis cuaca dan energi.",
        recommendation,
      );
    },
  ),
};
