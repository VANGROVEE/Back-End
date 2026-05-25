import type { Router } from "express";
import { analyticController } from "./analytics.controller";

export default (router: Router, prefix: String) => {
  router.get(prefix + "/users-active", analyticController.usersActive);
  router.get(prefix + "/ai-performance", analyticController.aiPerformance);
};
