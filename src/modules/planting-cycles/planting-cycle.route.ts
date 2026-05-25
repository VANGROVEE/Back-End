import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
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
  router.get(
    prefix,
    authenticate,
    autoCache(1800, true),
    plantingCycleController.findAll,
  );

  router.get(
    `${prefix}/heatmap-calendar`,
    authenticate,
    validate(getPlantingCycleSchema),
    autoCache(3600, true),
    plantingCycleController.getHeatmapCalendar,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    autoCache(1800, true),
    plantingCycleController.findOne,
  );

  router.post(
    prefix,
    authenticate,
    validate(createPlantingCycleSchema),
    plantingCycleController.create,
  );

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    validate(updatePlantingCycleSchema),
    plantingCycleController.update,
  );

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    plantingCycleController.delete,
  );
};
