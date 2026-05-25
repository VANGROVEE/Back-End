import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { userController } from "./user.controller";
import "./user.docs";
import { createUserSchema, updateUserSchema } from "./user.dto";

export default (router: Router, prefix: string) => {
  router.get(prefix, authenticate, autoCache(300), userController.findAll);

  router.get(
    `${prefix}/stats`,
    authenticate,
    autoCache(3600),
    userController.getStats,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    autoCache(1800, true),
    userController.findOne,
  );

  router.post(prefix, validate(createUserSchema), userController.create);

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.withId(updateUserSchema)),
    userController.update,
  );

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    userController.delete,
  );
};
