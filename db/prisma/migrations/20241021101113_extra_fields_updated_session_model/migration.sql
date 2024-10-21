/*
  Warnings:

  - You are about to drop the column `accesToken` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accessToken]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accessToken` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `accessTokenExpiresAt` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `refreshTokenExpiresAt` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "Session_accesToken_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "accesToken",
ADD COLUMN     "accessToken" TEXT NOT NULL,
DROP COLUMN "accessTokenExpiresAt",
ADD COLUMN     "accessTokenExpiresAt" INTEGER NOT NULL,
DROP COLUMN "refreshTokenExpiresAt",
ADD COLUMN     "refreshTokenExpiresAt" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_accessToken_key" ON "Session"("accessToken");
