-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Update existing users
-- Administrators should be updated manually with appropriate roles
-- This is a placeholder for the actual update script
-- UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@example.com';
-- UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "email" = 'superadmin@example.com';
-- UPDATE "User" SET "role" = 'MODERATOR' WHERE "email" IN ('mod1@example.com', 'mod2@example.com'); 