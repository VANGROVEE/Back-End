/*
  Warnings:

  - You are about to drop the column `weather_condition` on the `daily_activities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "daily_activities" DROP COLUMN "weather_condition",
ADD COLUMN     "unit" VARCHAR,
ADD COLUMN     "weather_data" JSONB;
