import { authenticate } from "@/common/middlewares/auth";
import { upload } from "@/common/middlewares/upload";
import { validate } from "@/common/middlewares/validate";
import { autoCache } from "@/common/utils/cache";
import { commonSchema } from "@/common/utils/schema";
import { Router } from "express";
import "./commodity.docs";
import { commodityController } from "./comodity.controller";
import {
  createCommoditySchema,
  importExcelSchema,
  updateCommoditySchema,
} from "./comodity.dto";

export default (router: Router, prefix: string) => {
  router.get(
    prefix,
    authenticate,
    autoCache(86400),
    commodityController.findAll,
  );

  router.get(
    `${prefix}/stats`,
    authenticate,
    autoCache(86400),
    commodityController.getStats,
  );

  router.get(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    autoCache(86400),
    commodityController.findOne,
  );

  router.post(
    prefix,
    authenticate,
    validate(createCommoditySchema),
    commodityController.create,
  );

  router.post(
    `${prefix}/import`,
    authenticate,
    upload.single("file"),
    validate(importExcelSchema),
    commodityController.uploadExcel,
  );

  router.patch(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.withId(updateCommoditySchema)),
    commodityController.update,
  );

  router.delete(
    `${prefix}/:id`,
    authenticate,
    validate(commonSchema.paramsId),
    commodityController.delete,
  );
};
