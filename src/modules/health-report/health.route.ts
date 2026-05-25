import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";

import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { healthController } from "./health.controller";
import {
  createHealthReportBodySchema,
  getHealthReportQuerySchema,
  updateHealthReportBodySchema,
} from "./health.dto";

export default (router: Router, prefix: string) => {
  router.get(
    prefix,
    authenticate,
    validate(getHealthReportQuerySchema),
    healthController.getAll,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    healthController.getById,
  );

  router.post(
    `${prefix}`,
    authenticate,
    validate(createHealthReportBodySchema),
    healthController.create,
  );

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.withId(updateHealthReportBodySchema)),
    healthController.update,
  );

  router.delete(`${prefix}/:id`, authenticate, healthController.delete);
};
