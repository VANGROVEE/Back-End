import { rootHandler } from "@/common/modules/root";
import { Router } from "express";

const router = Router();

router.get("/", rootHandler);

export default router;
