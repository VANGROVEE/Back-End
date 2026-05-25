-- CreateEnum
CREATE TYPE "CommodityCategory" AS ENUM ('MANGROVE', 'PANGAN', 'HORTIKULTURA', 'PERKEBUNAN', 'HERBAL');

-- AlterTable
ALTER TABLE "commodities" ADD COLUMN     "category" "CommodityCategory" NOT NULL DEFAULT 'MANGROVE';
