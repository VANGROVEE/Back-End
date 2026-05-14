/*
  Warnings:

  - You are about to drop the column `commodity_name` on the `planting_cycles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[label_ai]` on the table `diseases` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `commodity_id` to the `diseases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label_ai` to the `diseases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `commodity_id` to the `planting_cycles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "diseases" ADD COLUMN     "commodity_id" UUID NOT NULL,
ADD COLUMN     "label_ai" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "planting_cycles" DROP COLUMN "commodity_name",
ADD COLUMN     "commodity_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "commodities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug_ai" TEXT NOT NULL,
    "is_ai_supported" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "commodities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commodities_name_key" ON "commodities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "commodities_slug_ai_key" ON "commodities"("slug_ai");

-- CreateIndex
CREATE UNIQUE INDEX "diseases_label_ai_key" ON "diseases"("label_ai");

-- AddForeignKey
ALTER TABLE "planting_cycles" ADD CONSTRAINT "planting_cycles_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diseases" ADD CONSTRAINT "diseases_commodity_id_fkey" FOREIGN KEY ("commodity_id") REFERENCES "commodities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
