import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { harvestReportController } from "./harvest.controller";
import { createHarvestReportBodySchema } from "./harvest.dto";

export default (router: Router, prefix: string) => {
  router.get(
    `${prefix}/dashboard`,
    authenticate,
    autoCache(1800, true),
    harvestReportController.getDashboardData,
  );

  // router.get(
  //   prefix,
  //   authenticate,
  //   autoCache(600, true),
  //   harvestReportController.findAll,
  // );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    autoCache(1800, true),
    harvestReportController.getById,
  );

  router.post(
    prefix,
    authenticate,
    validate(createHarvestReportBodySchema),
    harvestReportController.create,
  );

  // router.delete(
  //   `${prefix}/:id`,
  //   authenticate,
  //   validate(commonSchema.paramsId),
  //   harvestReportController.delete,
  // );
};
