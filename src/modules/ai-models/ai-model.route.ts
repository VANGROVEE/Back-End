import { validate } from "@/common/middlewares/validate";
import type { Router } from "express";
import { aiModelController } from "./ai-model.controller";
import { predictOnlySchema, saveHealthReportSchema } from "./ai-model.dto";

export default (router: Router, prefix: string) => {
  router.post(
    `${prefix}/predict-only`,
    validate(predictOnlySchema),
    aiModelController.predictOnly,
  );

  router.post(
    `${prefix}/report`,
    validate(saveHealthReportSchema),
    aiModelController.predictPlantDisease,
  );
};
