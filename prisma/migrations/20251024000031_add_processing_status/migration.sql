-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('CREATED', 'PROCESSING', 'COMPLETED', 'ERROR');

-- AlterTable
ALTER TABLE "Broker" ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'CREATED';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'CREATED';
