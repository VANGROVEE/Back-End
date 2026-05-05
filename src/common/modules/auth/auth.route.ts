import { validate } from "@/common/middlewares/validate";
import { Router } from "express";
import { authController } from "./auth.controller";
import "./auth.docs";
import { loginSchema, registerSchema } from "./auth.dto";

export default (router: Router, prefix: string) => {
  router.post(`${prefix}/login`, validate(loginSchema), authController.login);

  router.post(
    `${prefix}/register`,
    validate(registerSchema),
    authController.register,
  );
};
