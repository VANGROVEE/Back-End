import { authenticate } from "@/common/middlewares/auth";
import { autoCache } from "@/common/utils/cache";
import { Router } from "express";
import { dashboardAnalyzeController } from "./dashboard-analyze.controller";

export default (router: Router, prefix: string) => {
  router.get(
    `${prefix}/spatial`,
    authenticate,
    autoCache(900, true),
    dashboardAnalyzeController.getSpatialAnalysis,
  );
  router.get(
    `${prefix}/health-reports`,
    authenticate,
    autoCache(900, true),
    dashboardAnalyzeController.getHealth,
  );

  router.get(
    `${prefix}/planting-trend`,
    authenticate,
    dashboardAnalyzeController.getPlantingTrend,
  );
  router.get(
    `${prefix}/diase-reports`,
    authenticate,
    autoCache(900, true),
    dashboardAnalyzeController.getDiseaseTrend,
  );

  router.get(
    `${prefix}/recommendations-reports`,
    authenticate,
    autoCache(900, true),
    dashboardAnalyzeController.getActiveRecommendations,
  );
};
