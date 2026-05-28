import { Router } from "express";
import { rootHandler } from "@/modules/root";

import authRoute from "@/modules/auth/auth.route";
import userRoute from "@/modules/user/user.route";
import landRoute from "@/modules/land/land.route";
import plantingCycleRoute from "@/modules/planting-cycles/planting-cycle.route";
import aiRecommendationRoute from "@/modules/ai-recommendation/ai-recommendation.route";
import dailyActivityRoute from "@/modules/daily-activity/daily-activity.route";
import analyticsRoute from "@/modules/analytics/analytics.route";
import commodityRoute from "@/modules/commodites/commodity.route";
import healthRoute from "@/modules/health-report/health.route";
import aiModelRoute from "@/modules/ai-models/ai-model.route";
import harvestRoute from "@/modules/harvest-report/harvest.route";
import notificationRoute from "@/modules/notifications/notification.route";
import dashboardAnalyzeRoute from "@/modules/dashboard/dashboard-analyze.route";

const router = Router();

const moduleRoutes = [
  { path: "/auth", route: authRoute },
  { path: "/users", route: userRoute },
  { path: "/land", route: landRoute },
  { path: "/planting-cycle", route: plantingCycleRoute },
  { path: "/ai-recommendation", route: aiRecommendationRoute },
  { path: "/daily-activities", route: dailyActivityRoute },
  { path: "/analytics", route: analyticsRoute },
  { path: "/commodities", route: commodityRoute },
  { path: "/health-report", route: healthRoute },
  { path: "/ml-model", route: aiModelRoute },
  { path: "/harvest-report", route: harvestRoute },
  { path: "/notifications", route: notificationRoute },
  { path: "/analyze", route: dashboardAnalyzeRoute },
];

router.get("/", rootHandler);

moduleRoutes.forEach((route) => {
  route.route(router, route.path);
});

export default router;
