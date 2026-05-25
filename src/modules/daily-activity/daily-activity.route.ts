import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { dailyActivityController } from "./daily-activity.controller";
import "./daily-activity.docs";
import {
  createDailyActivitySchema,
  updateDailyActivitySchema,
} from "./daily-activity.dto";

export default (router: Router, prefix: string) => {
  router.get(
    prefix,
    authenticate,
    autoCache(600, true),
    dailyActivityController.findAll,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    autoCache(600, true),
    dailyActivityController.findOne,
  );

  router.post(
    prefix,
    authenticate,
    validate(createDailyActivitySchema),
    dailyActivityController.create,
  );

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.withId(updateDailyActivitySchema)),
    dailyActivityController.update,
  );

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    dailyActivityController.delete,
  );
};
