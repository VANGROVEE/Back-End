/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth_credentials" ADD COLUMN     "role" "ROLE" NOT NULL DEFAULT 'FARMER';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";
