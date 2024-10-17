/*
  Warnings:

  - Added the required column `latestChat` to the `ChatPartners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatPartners" ADD COLUMN     "latestChat" TEXT NOT NULL;
