import { Router } from "express";
import { rootHandler } from "@/common/modules/root";

const router = Router();

router.get("/", rootHandler);

export default router;
