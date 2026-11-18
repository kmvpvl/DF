-- AlterTable
ALTER TABLE `Location` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `location` JSON NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `deliveryAddress` VARCHAR(191) NULL;
