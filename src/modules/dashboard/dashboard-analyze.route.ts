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
};
