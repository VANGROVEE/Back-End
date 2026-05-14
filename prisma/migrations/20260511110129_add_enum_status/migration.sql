/*
  Warnings:

  - Changed the type of `status` on the `planting_cycles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "STATUS" AS ENUM ('HARVESTED', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "planting_cycles" DROP COLUMN "status",
ADD COLUMN     "status" "STATUS" NOT NULL;
