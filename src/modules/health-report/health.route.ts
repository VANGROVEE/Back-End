import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
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
    autoCache(1800, true),
    healthController.getAll,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    autoCache(1800, true),
    healthController.getById,
  );

  router.post(
    prefix,
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

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    healthController.delete,
  );
};
