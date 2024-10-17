/*
  Warnings:

  - A unique constraint covering the columns `[senderEmail,chatPartnerEmail]` on the table `ChatPartners` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `senderEmail` to the `ChatPartners` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ChatPartners_senderId_chatPartnerId_key";

-- AlterTable
ALTER TABLE "ChatPartners" ADD COLUMN     "senderEmail" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "ChatPartners_senderEmail_chatPartnerEmail_key" ON "ChatPartners"("senderEmail", "chatPartnerEmail");
