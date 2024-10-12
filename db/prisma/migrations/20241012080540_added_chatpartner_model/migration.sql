-- CreateTable
CREATE TABLE "ChatPartners" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "senderName" TEXT NOT NULL,
    "chatPartnerId" INTEGER NOT NULL,
    "chatPartnerName" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatPartners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatPartners_id_key" ON "ChatPartners"("id");
