import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { Router } from "express";
import { harvestReportController } from "./harvest.controller";
import { createHarvestReportBodySchema } from "./harvest.dto";
export default (router: Router, prefix: string) => {
  router.get(
    `${prefix}/dashboard`,
    authenticate,
    harvestReportController.getDashboardData,
  );

  router.get(prefix, authenticate, harvestReportController.getById);

  router.get(`${prefix}/:id`, authenticate, harvestReportController.getById);

  router.post(
    prefix,
    authenticate,
    validate(createHarvestReportBodySchema),
    harvestReportController.create,
  );

  // router.patch(
  //   `${prefix}/:id`,
  //   authenticate,
  //   validate(commonSchema.withId(updateHarvestReportBodySchema)),
  //   harvestReportController.,
  // );

  // router.delete(`${prefix}/:id`, authenticate, harvestReportController.);
};
