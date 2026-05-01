/*
  Warnings:

  - A unique constraint covering the columns `[cycle_id,activity_date,activity_type]` on the table `daily_activities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `activity_date` to the `daily_activities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "daily_activities" ADD COLUMN     "activity_date" DATE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "daily_activities_cycle_id_activity_date_activity_type_key" ON "daily_activities"("cycle_id", "activity_date", "activity_type");
