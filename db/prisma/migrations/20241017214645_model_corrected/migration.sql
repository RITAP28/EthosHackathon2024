/*
  Warnings:

  - Made the column `textMetadata` on table `Chat` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "textMetadata" SET NOT NULL;

-- AlterTable
ALTER TABLE "ChatPartners" ALTER COLUMN "latestChat" DROP NOT NULL;
