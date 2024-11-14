/*
  Warnings:

  - You are about to drop the column `userId` on the `Notifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[receiverEmail,senderEmail]` on the table `Notifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverEmail` to the `Notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `Notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderEmail` to the `Notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notifications" DROP COLUMN "userId",
ADD COLUMN     "receiverEmail" TEXT NOT NULL,
ADD COLUMN     "receiverId" INTEGER NOT NULL,
ADD COLUMN     "senderEmail" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Notifications_receiverEmail_senderEmail_key" ON "Notifications"("receiverEmail", "senderEmail");
