import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import type { Router } from "express";
import { landController } from "./land.controller";
import "./land.docs";
import { createLandSchema, updateLandSchema } from "./land.dto";
export default (router: Router, prefix: string) => {
  router.post(
    prefix,
    authenticate,
    validate(createLandSchema),
    landController.create,
  );

  router.get(prefix, authenticate, landController.getAll);

  router.get(
    `${prefix}/:id`,
    validate(commonSchema.paramsId),
    authenticate,
    landController.getById,
  );

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.withId(updateLandSchema)),
    landController.update,
  );

  router.delete(
    `${prefix}/:id`,
    validate(commonSchema.paramsId),
    authenticate,
    landController.delete,
  );
};
