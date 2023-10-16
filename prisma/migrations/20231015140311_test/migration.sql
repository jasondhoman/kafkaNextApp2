-- CreateTable
CREATE TABLE "SampleData" (
    "id" TEXT NOT NULL,
    "points" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SampleData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SampleData_createdAt_key" ON "SampleData"("createdAt");
