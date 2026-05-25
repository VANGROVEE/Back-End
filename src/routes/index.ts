import aiModelRoute from "@/modules/ai-models/ai-model.route";
import aiRecommendationRoute from "@/modules/ai-recommendation/ai-recommendation.route";
import analyticsRoute from "@/modules/analytics/analytics.route";
import authRoute from "@/modules/auth/auth.route";
import commodityRoute from "@/modules/commodites/commodity.route";
import dailyActivityRoute from "@/modules/daily-activity/daily-activity.route";
import harvestRoute from "@/modules/harvest-report/harvest.route";
import healthRoute from "@/modules/health-report/health.route";
import landRoute from "@/modules/land/land.route";
import plantingCycleRoute from "@/modules/planting-cycles/planting-cycle.route";
import { rootHandler } from "@/modules/root";
import userRoute from "@/modules/user/user.route";
import { Router } from "express";

const router = Router();

router.get("/", rootHandler);

authRoute(router, "/auth");

userRoute(router, "/users");

landRoute(router, "/land");
plantingCycleRoute(router, "/planting-cycle");

aiRecommendationRoute(router, "/ai-recommendation");

dailyActivityRoute(router, "/daily-activities");
analyticsRoute(router, "/analytics");

commodityRoute(router, "/commodities");

healthRoute(router, "/health-report");

aiModelRoute(router, "/ml-model");

harvestRoute(router, "/harvest-report");
export default router;
