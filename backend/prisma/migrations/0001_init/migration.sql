-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('PROTEIN', 'CARB', 'FIBER', 'FAT', 'SUPPLEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PLANNED', 'COOKING', 'DONE', 'DELIVERED');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'SENT', 'DISMISSED', 'REPURCHASED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightKg" DECIMAL(6,2) NOT NULL,
    "activityFactor" DECIMAL(4,2) NOT NULL,
    "notes" TEXT,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "IngredientCategory" NOT NULL,
    "purchasePrice" DECIMAL(10,2) NOT NULL,
    "purchaseWeightGrams" DECIMAL(10,2) NOT NULL,
    "kcalPer100g" DECIMAL(8,2) NOT NULL,
    "proteinPer100g" DECIMAL(8,2) NOT NULL,
    "fiberPer100g" DECIMAL(8,2) NOT NULL,
    "carbPer100g" DECIMAL(8,2) NOT NULL,
    "fatPer100g" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "proteinPercent" DECIMAL(5,2) NOT NULL,
    "fiberPercent" DECIMAL(5,2) NOT NULL,
    "carbPercent" DECIMAL(5,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DietItem" (
    "id" TEXT NOT NULL,
    "dietId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "role" "IngredientCategory" NOT NULL,
    "shareWithinGroup" DECIMAL(5,4) NOT NULL DEFAULT 1.0,

    CONSTRAINT "DietItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "dietId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "packageCount" INTEGER NOT NULL,
    "packageWeightGrams" DECIMAL(8,2) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "startConsumptionDate" TIMESTAMP(3),
    "daysOfFood" DECIMAL(8,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "gramsTotal" DECIMAL(10,2) NOT NULL,
    "costTotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "BatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "ingredientCost" DECIMAL(10,2) NOT NULL,
    "packagingUnitCost" DECIMAL(10,2) NOT NULL,
    "packagingCost" DECIMAL(10,2) NOT NULL,
    "laborHours" DECIMAL(6,2) NOT NULL,
    "laborCostPerHour" DECIMAL(10,2) NOT NULL,
    "laborCost" DECIMAL(10,2) NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "marginPercent" DECIMAL(5,2) NOT NULL,
    "suggestedPrice" DECIMAL(10,2) NOT NULL,
    "profit" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reminderDate" TIMESTAMP(3) NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "laborCostPerHour" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "packagingUnitCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "defaultMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "reminderBufferDays" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_batchId_key" ON "Pricing"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_batchId_key" ON "Alert"("batchId");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diet" ADD CONSTRAINT "Diet_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietItem" ADD CONSTRAINT "DietItem_dietId_fkey" FOREIGN KEY ("dietId") REFERENCES "Diet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DietItem" ADD CONSTRAINT "DietItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_dietId_fkey" FOREIGN KEY ("dietId") REFERENCES "Diet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItem" ADD CONSTRAINT "BatchItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchItem" ADD CONSTRAINT "BatchItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pricing" ADD CONSTRAINT "Pricing_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

