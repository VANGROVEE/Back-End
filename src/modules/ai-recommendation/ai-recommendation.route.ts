import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import type { Router } from "express";
import { aiRecommendationController } from "./ai-recommendation.controller";
import "./ai-recommendation.docs";
import { autoCache } from "@/common/utils/cache";
import { aiRecommendationQuerySchema } from "./ai-recommendation.dto";

export default (router: Router, prefix: string) => {
  router.get(
    prefix + "/daily-recommendation/:id",
    validate(commonSchema.paramsId),
    authenticate,
    autoCache(43200, true),
    aiRecommendationController.getDailyRecommendation,
  );

  router.get(
    prefix + "/analyze-crop-failure/:id",
    validate(commonSchema.paramsId),
    authenticate,
    autoCache(3600, true),
    aiRecommendationController.getAnalyzeCropFailure,
  );

  router.get(
    prefix,
    validate(aiRecommendationQuerySchema),
    authenticate,

    autoCache(600, true),
    aiRecommendationController.getAiRecomendation,
  );
};
