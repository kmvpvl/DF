/*
  Warnings:

  - Added the required column `outcome` to the `ProcessMap` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ProcessMap` ADD COLUMN `outcome` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `Ingredient` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `materialId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `processMapId` VARCHAR(191) NOT NULL,

    INDEX `Ingredient_productId_fkey`(`productId`),
    INDEX `Ingredient_materialId_fkey`(`materialId`),
    INDEX `Ingredient_processMapId_fkey`(`processMapId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ingredient` ADD CONSTRAINT `Ingredient_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ingredient` ADD CONSTRAINT `Ingredient_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ingredient` ADD CONSTRAINT `Ingredient_processMapId_fkey` FOREIGN KEY (`processMapId`) REFERENCES `ProcessMap`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
