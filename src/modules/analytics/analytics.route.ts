import { authenticate } from "@/common/middlewares/auth";
import { autoCache } from "@/common/utils/cache";
import type { Router } from "express";
import { analyticController } from "./analytics.controller";
import "./analytics.docs";
export default (router: Router, prefix: string) => {
  router.get(
    `${prefix}/users-active`,
    authenticate,
    autoCache(3600),
    analyticController.usersActive,
  );

  router.get(
    `${prefix}/ai-performance`,
    authenticate,
    autoCache(1800),
    analyticController.aiPerformance,
  );
};
