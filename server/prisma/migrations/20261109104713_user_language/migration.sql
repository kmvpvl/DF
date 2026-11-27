-- AlterTable
ALTER TABLE `Order` MODIFY `orderDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `OrderProduct` MODIFY `variationLabel` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `lang` VARCHAR(191) NULL;
