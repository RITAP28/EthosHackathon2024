-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "membersEmail" TEXT[],
    "totalMembers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Members" (
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "groupName" TEXT NOT NULL,
    "groupRole" "GroupRole" NOT NULL DEFAULT 'MEMBER'
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_id_key" ON "Group"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Group_id_name_key" ON "Group"("id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Members_userId_groupId_key" ON "Members"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "Members" ADD CONSTRAINT "Members_groupId_groupName_fkey" FOREIGN KEY ("groupId", "groupName") REFERENCES "Group"("id", "name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Members" ADD CONSTRAINT "Members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
