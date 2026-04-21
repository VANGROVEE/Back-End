import authRoute from "@/common/modules/auth/auth.route";
import { rootHandler } from "@/common/modules/root";
import { Router } from "express";


const router = Router();

router.get("/", rootHandler);

authRoute(router, "/auth");

export default router;
