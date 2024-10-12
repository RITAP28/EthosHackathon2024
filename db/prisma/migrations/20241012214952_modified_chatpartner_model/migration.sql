/*
  Warnings:

  - A unique constraint covering the columns `[senderId,chatPartnerId]` on the table `ChatPartners` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChatPartners_senderId_chatPartnerId_key" ON "ChatPartners"("senderId", "chatPartnerId");
