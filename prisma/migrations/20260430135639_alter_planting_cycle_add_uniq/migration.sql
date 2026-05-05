/*
  Warnings:

  - A unique constraint covering the columns `[land_id,start_date]` on the table `planting_cycles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "planting_cycles_land_id_start_date_key" ON "planting_cycles"("land_id", "start_date");
