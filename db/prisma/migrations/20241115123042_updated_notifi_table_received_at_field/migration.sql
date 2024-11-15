-- AlterTable
ALTER TABLE "Notifications" ADD COLUMN     "groupName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receivedAt" TIMESTAMP(3);
