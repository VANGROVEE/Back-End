-- CreateTable
CREATE TABLE "ai_recommendation_logs" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "recommendation_date" DATE NOT NULL,
    "ai_response" JSONB NOT NULL,
    "context_used" JSONB,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_recommendation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_recommendation_logs_cycle_id_recommendation_date_key" ON "ai_recommendation_logs"("cycle_id", "recommendation_date");

-- AddForeignKey
ALTER TABLE "ai_recommendation_logs" ADD CONSTRAINT "ai_recommendation_logs_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "planting_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
