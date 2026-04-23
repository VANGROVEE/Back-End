import authRoute from "@/common/modules/auth/auth.route";
import { rootHandler } from "@/common/modules/root";
import userRoute from "@/common/modules/user/user.route";
import { Router } from "express";

const router = Router();

router.get("/", rootHandler);

authRoute(router, "/auth");
userRoute(router, "/user");

export default router;
