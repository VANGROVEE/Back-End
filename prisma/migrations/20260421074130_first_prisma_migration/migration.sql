-- CreateEnum
CREATE TYPE "ROLE" AS ENUM ('ADMIN', 'FARMER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "nickname" VARCHAR,
    "avatar_url" VARCHAR,
    "phone_number" VARCHAR,
    "bio" TEXT,
    "address_home" TEXT,
    "role" "ROLE" NOT NULL,
    "fcm_token" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login" TIMESTAMP,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lands" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "total_area" REAL NOT NULL,
    "location" JSONB,
    "land_certificate_url" VARCHAR,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planting_cycles" (
    "id" UUID NOT NULL,
    "land_id" UUID NOT NULL,
    "commodity_name" VARCHAR NOT NULL,
    "variety" VARCHAR,
    "planting_method" VARCHAR,
    "start_date" DATE NOT NULL,
    "estimated_harvest" DATE,
    "status" VARCHAR NOT NULL,

    CONSTRAINT "planting_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activities" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "activity_type" VARCHAR NOT NULL,
    "amount" REAL,
    "notes" TEXT,
    "weather_condition" VARCHAR,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diseases" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "scientific_name" VARCHAR,
    "description" TEXT,
    "local_treatment" TEXT,
    "preventive_action" TEXT,

    CONSTRAINT "diseases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_reports" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "disease_id" UUID,
    "image_url" VARCHAR,
    "confidence_score" REAL,
    "gemini_insight" JSONB,
    "is_outbreak_trigger" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_reports" (
    "id" UUID NOT NULL,
    "cycle_id" UUID NOT NULL,
    "total_yield_kg" REAL NOT NULL,
    "ai_quality_metrics" JSONB,
    "quality_grade" VARCHAR,
    "image_proof_url" VARCHAR,
    "price_sold_per_kg" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harvest_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_prices" (
    "id" UUID NOT NULL,
    "commodity_name" VARCHAR NOT NULL,
    "price_min" INTEGER NOT NULL,
    "price_max" INTEGER NOT NULL,
    "region" VARCHAR NOT NULL,
    "source" VARCHAR,
    "recorded_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_credentials_user_id_key" ON "auth_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_credentials_email_key" ON "auth_credentials"("email");

-- CreateIndex
CREATE UNIQUE INDEX "harvest_reports_cycle_id_key" ON "harvest_reports"("cycle_id");

-- AddForeignKey
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lands" ADD CONSTRAINT "lands_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planting_cycles" ADD CONSTRAINT "planting_cycles_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "planting_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_reports" ADD CONSTRAINT "health_reports_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "planting_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_reports" ADD CONSTRAINT "health_reports_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_reports" ADD CONSTRAINT "harvest_reports_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "planting_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
