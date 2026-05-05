/*
  Warnings:

  - You are about to drop the `auth_credentials` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "auth_credentials" DROP CONSTRAINT "auth_credentials_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "ROLE" NOT NULL DEFAULT 'FARMER';

-- DropTable
DROP TABLE "auth_credentials";
