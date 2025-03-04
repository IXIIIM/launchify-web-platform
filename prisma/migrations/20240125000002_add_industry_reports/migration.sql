-- CreateTable
CREATE TABLE "IndustryReport" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IndustryReport_pkey" PRIMARY KEY ("id")
);