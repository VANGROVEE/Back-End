import aiRecommendationRoute from "@/common/modules/ai-recommendation/ai-recommendation.route";
import analyticsRoute from "@/common/modules/analytics/analytics.route";
import authRoute from "@/common/modules/auth/auth.route";
import commodityRoute from "@/common/modules/commodites/commodity.route";
import dailyActivityRoute from "@/common/modules/daily-activity/daily-activity.route";
import healthRoute from "@/common/modules/health-report/health.route";
import landRoute from "@/common/modules/land/land.route";
import plantingCycleRoute from "@/common/modules/planting-cycles/planting-cycle.route";
import { rootHandler } from "@/common/modules/root";
import userRoute from "@/common/modules/user/user.route";
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

healthRoute(router, "/health");
export default router;
