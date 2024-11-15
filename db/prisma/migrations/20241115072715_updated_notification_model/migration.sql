/*
  Warnings:

  - A unique constraint covering the columns `[receiverEmail,senderEmail,id]` on the table `Notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Notifications_receiverEmail_senderEmail_key";

-- CreateIndex
CREATE UNIQUE INDEX "Notifications_receiverEmail_senderEmail_id_key" ON "Notifications"("receiverEmail", "senderEmail", "id");
