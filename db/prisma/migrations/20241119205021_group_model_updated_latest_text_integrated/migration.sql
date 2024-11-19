-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "latestText" TEXT,
ADD COLUMN     "latestTextSentAt" TIMESTAMP(3),
ADD COLUMN     "latestTextSentById" INTEGER,
ADD COLUMN     "userId" INTEGER;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_latestTextSentById_fkey" FOREIGN KEY ("latestTextSentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
