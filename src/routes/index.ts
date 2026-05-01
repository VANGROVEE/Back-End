import authRoute from "@/common/modules/auth/auth.route";
import dailyActivityRoute from "@/common/modules/daily-activity/daily-activity.route";
import landRoute from "@/common/modules/land/land.route";
import plantingCycleRoute from "@/common/modules/planting-cycles/planting-cycle.route";
import { rootHandler } from "@/common/modules/root";
import userRoute from "@/common/modules/user/user.route";
import { Router } from "express";

const router = Router();

router.get("/", rootHandler);

authRoute(router, "/auth");

userRoute(router, "/user");

landRoute(router, "/land");
plantingCycleRoute(router, "/planting-cycle");

dailyActivityRoute(router, "/daily-activities");
export default router;
