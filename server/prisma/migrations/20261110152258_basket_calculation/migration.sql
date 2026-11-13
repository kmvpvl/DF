/*
  Warnings:

  - You are about to drop the column `priceOptions` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Location` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `currencyCode` VARCHAR(191) NOT NULL DEFAULT 'RSD',
    ADD COLUMN `currencySymbol` VARCHAR(191) NOT NULL DEFAULT 'din',
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'Europe/Belgrade',
    ADD COLUMN `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `priceOptions`;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `label` JSON NOT NULL,
    `isWeightBased` BOOLEAN NOT NULL DEFAULT false,
    `weight` DOUBLE NOT NULL DEFAULT 0,
    `weightUnit` VARCHAR(191) NOT NULL DEFAULT 'g',

    INDEX `ProductVariant_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductModifierGroup` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `title` JSON NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `minSelect` INTEGER NOT NULL DEFAULT 0,
    `maxSelect` INTEGER NOT NULL DEFAULT 1,

    INDEX `ProductModifierGroup_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductModifier` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `name` JSON NOT NULL,
    `weight` DOUBLE NULL,
    `weightUnit` VARCHAR(191) NULL,

    INDEX `ProductModifier_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocationProductConfig` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `isPublicInLocation` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LocationProductConfig_locationId_productId_key`(`locationId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocationVariantConfig` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `individualPrice` DOUBLE NOT NULL,
    `legalEntityPrice` DOUBLE NULL,
    `individualDiscounts` JSON NULL,
    `legalDiscounts` JSON NULL,
    `stock` DOUBLE NOT NULL DEFAULT 0,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LocationVariantConfig_locationId_variantId_key`(`locationId`, `variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocationModifierConfig` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `modifierId` VARCHAR(191) NOT NULL,
    `individualPrice` DOUBLE NOT NULL,
    `legalEntityPrice` DOUBLE NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LocationModifierConfig_locationId_modifierId_key`(`locationId`, `modifierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ComboItem` (
    `id` VARCHAR(191) NOT NULL,
    `comboId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    INDEX `ComboItem_comboId_idx`(`comboId`),
    INDEX `ComboItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductModifierGroup` ADD CONSTRAINT `ProductModifierGroup_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductModifier` ADD CONSTRAINT `ProductModifier_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `ProductModifierGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationProductConfig` ADD CONSTRAINT `LocationProductConfig_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationProductConfig` ADD CONSTRAINT `LocationProductConfig_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationVariantConfig` ADD CONSTRAINT `LocationVariantConfig_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationModifierConfig` ADD CONSTRAINT `LocationModifierConfig_modifierId_fkey` FOREIGN KEY (`modifierId`) REFERENCES `ProductModifier`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComboItem` ADD CONSTRAINT `ComboItem_comboId_fkey` FOREIGN KEY (`comboId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ComboItem` ADD CONSTRAINT `ComboItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
