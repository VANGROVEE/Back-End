-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('DAILY', 'FAILURE_ANALYSIS');

-- AlterTable
ALTER TABLE "ai_recommendation_logs" ADD COLUMN     "type" "RecommendationType" NOT NULL DEFAULT 'DAILY';
