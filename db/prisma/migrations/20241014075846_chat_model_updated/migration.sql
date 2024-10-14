/*
  Warnings:

  - You are about to drop the column `receiverId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Chat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[senderEmail]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[receiverEmail]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverEmail` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderEmail` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_senderId_fkey";

-- DropIndex
DROP INDEX "Chat_receiverId_key";

-- DropIndex
DROP INDEX "Chat_senderId_key";

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "receiverEmail" TEXT NOT NULL,
ADD COLUMN     "senderEmail" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_senderEmail_key" ON "Chat"("senderEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_receiverEmail_key" ON "Chat"("receiverEmail");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_senderEmail_fkey" FOREIGN KEY ("senderEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
