import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import type { Router } from "express";
import { aiRecommendationController } from "./ai-recommendation.controller";
import "./ai-recommendation.docs";
import { autoCache } from "@/common/utils/cache";

export default (router: Router, prefix: string) => {
  router.get(
    prefix + "/:id",
    validate(commonSchema.paramsId),
    authenticate,
    autoCache(43200, true),
    aiRecommendationController.getDailyRecommendation,
  );
};
