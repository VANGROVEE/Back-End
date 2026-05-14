import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import type { Router } from "express";
import { plantingCycleController } from "./planting-cycle.controller";
import {
  createPlantingCycleSchema,
  getPlantingCycleSchema,
  updatePlantingCycleSchema,
} from "./planting-cycle.dto";

import "./planting-cycle.docs";

export default (router: Router, prefix: string) => {
  router.post(
    prefix,
    authenticate,
    validate(createPlantingCycleSchema),
    plantingCycleController.create,
  );

  router.patch(
    prefix + "/:id",
    authenticate,
    validate(updatePlantingCycleSchema),
    plantingCycleController.update,
  );

  router.get(
    prefix + "/heatmap-calendar",
    authenticate,
    validate(getPlantingCycleSchema),
    plantingCycleController.getHeatmapCalendar,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    plantingCycleController.findOne,
  );

  router.get(prefix, authenticate, plantingCycleController.findAll);
  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    plantingCycleController.delete,
  );
};
