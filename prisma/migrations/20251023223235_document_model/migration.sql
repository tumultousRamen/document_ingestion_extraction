-- AlterTable
ALTER TABLE "Broker" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "fullText" TEXT,
    "fileHash" TEXT,
    "objectKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "brokerId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
