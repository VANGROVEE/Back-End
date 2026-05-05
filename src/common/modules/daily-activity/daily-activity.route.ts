import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { dailyActivityController } from "./daily-activity.controller";
import "./daily-activity.docs";
import {
  createDailyActivitySchema,
  updateDailyActivitySchema,
} from "./daily-activity.dto";

export default (router: Router, prefix: string) => {
  router.post(
    prefix,
    authenticate,
    validate(createDailyActivitySchema),
    dailyActivityController.create,
  );

  router.get(prefix, authenticate, dailyActivityController.findAll);

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    dailyActivityController.findOne,
  );

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.withId(updateDailyActivitySchema)),
    dailyActivityController.update,
  );

  router.delete(
    `${prefix}/:id`,
    validate(commonSchema.paramsId),
    authenticate,
    dailyActivityController.delete,
  );
};
