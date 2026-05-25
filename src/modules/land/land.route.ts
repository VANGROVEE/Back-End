import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { landController } from "./land.controller";
import "./land.docs";
import {
  adminCreateLandSchema,
  createLandSchema,
  updateLandSchema,
} from "./land.dto";

export default (router: Router, prefix: string) => {
  router.get(
    `${prefix}/admin`,
    authenticate,
    autoCache(1800),
    landController.getLands,
  );

  router.get(
    prefix,
    authenticate,
    autoCache(1800, true),
    landController.getAll,
  );

  router.get(
    `${prefix}/stats`,
    authenticate,
    autoCache(3600),
    landController.getStats,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    autoCache(1800, true),
    landController.getById,
  );

  router.post(
    `${prefix}/admin`,
    authenticate,
    validate(adminCreateLandSchema),
    landController.adminCreate,
  );

  router.post(
    prefix,
    authenticate,
    validate(createLandSchema),
    landController.create,
  );

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.withId(updateLandSchema)),
    landController.update,
  );

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    landController.delete,
  );
};
