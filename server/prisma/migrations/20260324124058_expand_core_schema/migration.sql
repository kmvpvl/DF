-- CreateTable
CREATE TABLE `Material` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `selfProduced` BOOLEAN NOT NULL DEFAULT false,
    `caloriesKcal` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `fatGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `proteinGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `carbohydratesGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `sugarsGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `fiberGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `saltGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `VAT` DOUBLE NOT NULL,
    `Price` DOUBLE NOT NULL,
    `purchaseUnit` VARCHAR(191) NOT NULL,
    `purchaseUnitAmount` DOUBLE NOT NULL,
    `consumptionUnit` VARCHAR(191) NOT NULL,
    `consumptionUnitAmount` DOUBLE NOT NULL,
    `ratio` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `batchPrefix` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `caloriesKcal` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `fatGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `proteinGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `carbohydratesGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `sugarsGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `fiberGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `saltGrams` DECIMAL(10, 3) NOT NULL DEFAULT 0,

    UNIQUE INDEX `Product_batchPrefix_key`(`batchPrefix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Batch` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `nettoWeight` DOUBLE NOT NULL,
    `number` INTEGER NOT NULL,
    `numberStr` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `storageDurationHours` INTEGER NOT NULL,
    `storageConditionId` VARCHAR(191) NOT NULL,
    `processMapId` VARCHAR(191) NULL,
    `processDeviations` VARCHAR(191) NULL,

    INDEX `Batch_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessMap` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessParameter` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `processMapId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageCondition` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerUserId` VARCHAR(191) NULL,
    `orderDate` DATETIME(3) NOT NULL,
    `orderDateReady` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderProduct` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` DOUBLE NOT NULL,
    `dateReady` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrderProduct_orderId_fkey`(`orderId`),
    INDEX `OrderProduct_productId_fkey`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sample` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `number` INTEGER NOT NULL,
    `numberStr` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `studyAt` DATETIME(3) NULL,
    `result` VARCHAR(191) NULL,

    INDEX `Sample_batchId_fkey`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_storageConditionId_fkey` FOREIGN KEY (`storageConditionId`) REFERENCES `StorageCondition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_processMapId_fkey` FOREIGN KEY (`processMapId`) REFERENCES `ProcessMap`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessMap` ADD CONSTRAINT `ProcessMap_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessParameter` ADD CONSTRAINT `ProcessParameter_processMapId_fkey` FOREIGN KEY (`processMapId`) REFERENCES `ProcessMap`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderProduct` ADD CONSTRAINT `OrderProduct_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderProduct` ADD CONSTRAINT `OrderProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sample` ADD CONSTRAINT `Sample_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
