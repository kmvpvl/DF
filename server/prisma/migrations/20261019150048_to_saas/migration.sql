-- CreateTable
CREATE TABLE `Company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Location` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Company` (`id`, `name`, `createdAt`, `updatedAt`) VALUES ('088e3a63cbcd11f1ba2cd256a398ea10', 'DF', '2026-10-19 00:00:00.000', '2026-10-19 00:00:00.000');

INSERT INTO `Location` (`id`, `name`, `companyId`) VALUES ('233c58f8cbcd11f1ba2cd256a398ea10', 'Pančevo', '088e3a63cbcd11f1ba2cd256a398ea10');

/*
  Warnings:

  - Added the required column `locationId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Batch` ADD COLUMN `locationId` VARCHAR(191) NOT NULL DEFAULT '233c58f8cbcd11f1ba2cd256a398ea10';

-- AlterTable
ALTER TABLE `Equipment` ADD COLUMN `locationId` VARCHAR(191) NOT NULL DEFAULT '233c58f8cbcd11f1ba2cd256a398ea10';

-- AlterTable
ALTER TABLE `Material` ADD COLUMN `companyId` VARCHAR(191) NOT NULL DEFAULT '088e3a63cbcd11f1ba2cd256a398ea10';

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `locationId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `companyId` VARCHAR(191) NOT NULL DEFAULT '088e3a63cbcd11f1ba2cd256a398ea10',
    ADD COLUMN `standardDose` DOUBLE NOT NULL DEFAULT 100.0;

-- AlterTable
ALTER TABLE `StorageCondition` ADD COLUMN `companyId` VARCHAR(191) NOT NULL DEFAULT '088e3a63cbcd11f1ba2cd256a398ea10';

-- CreateTable
CREATE TABLE `UserLocationRoles` (
    `id` VARCHAR(191) NOT NULL,
    `locationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPERVISOR') NOT NULL DEFAULT 'EMPLOYEE',

    UNIQUE INDEX `UserLocationRoles_userId_locationId_key`(`userId`, `locationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `UserLocationRoles` (`id`, `locationId`, `userId`, `role`)
SELECT REPLACE(UUID(), '-', '') AS clean_uuid, '233c58f8cbcd11f1ba2cd256a398ea10', 'cmmwb15ct0001favlab1tw2yi', 'ADMIN'
FROM `User`
WHERE `id` = 'cmmwb15ct0001favlab1tw2yi'
LIMIT 1
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`);

-- CreateTable
CREATE TABLE `Movement` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('PURCHASE', 'PRODUCTION', 'SALE', 'WRITE_OFF', 'RETURN', 'MOVE_IN', 'MOVE_OUT') NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NULL,
    `quantity` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `locationId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovementGroup` (
    `id` VARCHAR(191) NOT NULL,
    `fromLocationId` VARCHAR(191) NOT NULL,
    `toLocationId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_LocationToUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_LocationToUser_AB_unique`(`A`, `B`),
    INDEX `_LocationToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CompanyToUser` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CompanyToUser_AB_unique`(`A`, `B`),
    INDEX `_CompanyToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Location` ADD CONSTRAINT `Location_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserLocationRoles` ADD CONSTRAINT `UserLocationRoles_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserLocationRoles` ADD CONSTRAINT `UserLocationRoles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipment` ADD CONSTRAINT `Equipment_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageCondition` ADD CONSTRAINT `StorageCondition_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Movement` ADD CONSTRAINT `Movement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Movement` ADD CONSTRAINT `Movement_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Movement` ADD CONSTRAINT `Movement_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Movement` ADD CONSTRAINT `Movement_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `MovementGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LocationToUser` ADD CONSTRAINT `_LocationToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LocationToUser` ADD CONSTRAINT `_LocationToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CompanyToUser` ADD CONSTRAINT `_CompanyToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CompanyToUser` ADD CONSTRAINT `_CompanyToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
