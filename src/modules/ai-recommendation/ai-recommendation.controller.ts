import { catchAsync } from "@/common/utils/express-async-errors";
import { sendResponse } from "@/common/utils/response";
import { ApiError } from "@/common/utils/api-error";
import type { Request, Response } from "express";
import { aiRecommendationService } from "./ai-recommendation.service";
import { RecommendationType } from "@/generated/prisma/client";

export const aiRecommendationController = {
  getAiRecomendation: catchAsync(async (req: Request, res: Response) => {
    const { cycle_id, type } = req.query as {
      cycle_id: string;
      type: RecommendationType;
    };

    const recommendations = await aiRecommendationService.findAll({
      where: {
        cycle_id,
        ...(type && { type }),
      },
      orderBy: { created_at: "desc" },
    });

    return sendResponse(
      res,
      200,
      "Berhasil Mendapatkan Rekomendasi",
      recommendations,
    );
  }),

  getDailyRecommendation: catchAsync(async (req: Request, res: Response) => {
    const { cycle_id } = req.params as { cycle_id: string };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await aiRecommendationService.findExisting(
      cycle_id,
      today,
      RecommendationType.DAILY,
    );

    if (existing) {
      return sendResponse(
        res,
        200,
        "Mengambil rekomendasi harian (cached).",
        existing,
      );
    }

    const context = await aiRecommendationService.getCycleContext(cycle_id);
    const aiResult =
      await aiRecommendationService.generateDailyAnalysis(context);

    const result = await aiRecommendationService.saveAnalysis(
      cycle_id,
      RecommendationType.DAILY,
      aiResult,
      context,
    );

    return sendResponse(
      res,
      201,
      "Rekomendasi AI harian berhasil dibuat.",
      result,
    );
  }),

  getAnalyzeCropFailure: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };

    const aiResult = await aiRecommendationService.generateFailureAnalysis(id);

    const result = await aiRecommendationService.saveAnalysis(
      id,
      RecommendationType.FAILURE_ANALYSIS,
      aiResult,
      { note: "Failure analysis requested" },
    );

    return sendResponse(
      res,
      200,
      "Analisis kegagalan berhasil disimpan.",
      result,
    );
  }),
};
