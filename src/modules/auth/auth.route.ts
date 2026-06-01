import { validate } from "@/common/middlewares/validate";
import { Router } from "express";
import { authController } from "./auth.controller";
import "./auth.docs";
import { loginSchema, registerSchema, googleLoginSchema } from "./auth.dto";

export default (router: Router, prefix: string) => {
  router.post(`${prefix}/login`, validate(loginSchema), authController.login);

  router.get(prefix + "/me", authController.getMe);

  router.post(
    `${prefix}/register`,
    validate(registerSchema),
    authController.register,
  );

  router.post(
    `${prefix}/google`,
    validate(googleLoginSchema),
    authController.googleLogin,
  );
};
