/*
  Warnings:

  - The values [HORTIKULTURA] on the enum `CommodityCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CommodityCategory_new" AS ENUM ('MANGROVE', 'PANGAN', 'HORTIKULTURA_SAYUR', 'HORTIKULTURA_BUAH', 'PERKEBUNAN', 'HERBAL');
ALTER TABLE "public"."commodities" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "commodities" ALTER COLUMN "category" TYPE "CommodityCategory_new" USING ("category"::text::"CommodityCategory_new");
ALTER TYPE "CommodityCategory" RENAME TO "CommodityCategory_old";
ALTER TYPE "CommodityCategory_new" RENAME TO "CommodityCategory";
DROP TYPE "public"."CommodityCategory_old";
ALTER TABLE "commodities" ALTER COLUMN "category" SET DEFAULT 'MANGROVE';
COMMIT;
