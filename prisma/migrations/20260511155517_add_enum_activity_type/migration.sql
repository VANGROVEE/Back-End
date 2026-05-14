/*
  Warnings:

  - The `activity_type` column on the `daily_activities` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('PLANTING', 'WATERING', 'FERTILIZING', 'PEST_CONTROL', 'MAINTENANCE', 'OBSERVATION', 'HARVESTING', 'OTHER');

-- AlterTable
ALTER TABLE "daily_activities" DROP COLUMN "activity_type",
ADD COLUMN     "activity_type" "ActivityType" NOT NULL DEFAULT 'OBSERVATION';

-- CreateIndex
CREATE UNIQUE INDEX "daily_activities_cycle_id_activity_date_activity_type_key" ON "daily_activities"("cycle_id", "activity_date", "activity_type");
