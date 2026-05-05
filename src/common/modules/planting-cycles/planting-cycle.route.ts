import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import type { Router } from "express";
import { plantingCycleController } from "./planting-cycle.controller";
import "./planting-cycle.docs";
import { createPlantingCycleSchema } from "./planting-cycle.dto";

export default (router: Router, prefix: string) => {
  router.post(
    prefix,
    authenticate,
    validate(createPlantingCycleSchema),
    plantingCycleController.create,
  );

  router.get(prefix, authenticate, plantingCycleController.findAll);

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    plantingCycleController.findOne,
  );

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    plantingCycleController.delete,
  );
};
