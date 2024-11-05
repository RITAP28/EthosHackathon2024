-- CreateTable
CREATE TABLE "GroupChat" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "groupName" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "textMetadata" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GroupChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupChat_id_key" ON "GroupChat"("id");
