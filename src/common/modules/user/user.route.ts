import { validate } from "@/common/middlewares/validate";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import { userController } from "./user.controller";
import { updateUserSchema } from "./user.dto";

export default (router: Router, prefix: string) => {
  router.get(prefix, userController.findAll);

  router.get(`${prefix}/:id`, userController.findOne);

  router.patch(
    `${prefix}/:id`,
    validate(commonSchema.withId(updateUserSchema)),
    userController.update,
  );

  router.delete(`${prefix}/:id`, userController.delete);
};
