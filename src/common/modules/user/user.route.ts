import { authenticate } from "@/common/middlewares/auth";
import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { userController } from "./user.controller";
import "./user.docs";
import { createUserSchema, updateUserSchema } from "./user.dto";
export default (router: Router, prefix: string) => {
  router.get(prefix, authenticate, userController.findAll);

  router.get(prefix + "/stats", authenticate, userController.getStats);
  router.get(`${prefix}/:id`, authenticate, userController.findOne);

  router.patch(
    `${prefix}/:id`,
    validate(commonSchema.withId(updateUserSchema)),
    userController.update,
  );
  router.post(`${prefix}`, validate(createUserSchema), userController.create);

  router.delete(`${prefix}/:id`, userController.delete);
};
