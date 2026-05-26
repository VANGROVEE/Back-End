/*
  Warnings:

  - A unique constraint covering the columns `[cycle_id,recommendation_date,type]` on the table `ai_recommendation_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ai_recommendation_logs_cycle_id_recommendation_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "ai_recommendation_logs_cycle_id_recommendation_date_type_key" ON "ai_recommendation_logs"("cycle_id", "recommendation_date", "type");
