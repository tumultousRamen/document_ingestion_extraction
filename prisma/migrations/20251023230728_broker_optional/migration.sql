-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_brokerId_fkey";

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "brokerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
