-- CreateTable
CREATE TABLE `Chapter` (
    `id` VARCHAR(191) NOT NULL,
    `name` JSON NOT NULL,
    `description` JSON NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `companyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Reset existing product chapters; chapter IDs can be assigned manually or from Staff Products.
ALTER TABLE `Product` MODIFY `chapters` JSON NOT NULL;
UPDATE `Product` SET `chapters` = JSON_ARRAY();

-- AddForeignKey
ALTER TABLE `Chapter` ADD CONSTRAINT `Chapter_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
