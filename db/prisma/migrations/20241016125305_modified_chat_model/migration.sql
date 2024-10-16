-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_senderEmail_fkey";

-- DropIndex
DROP INDEX "Chat_receiverEmail_key";

-- DropIndex
DROP INDEX "Chat_senderEmail_key";
