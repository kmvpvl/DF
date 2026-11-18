-- AlterTable
ALTER TABLE `Order` ADD COLUMN `deliveryLocation` JSON NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `location` JSON NULL;
