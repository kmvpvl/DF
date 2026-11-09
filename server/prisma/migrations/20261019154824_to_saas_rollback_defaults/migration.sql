-- AlterTable
ALTER TABLE `Batch` ALTER COLUMN `locationId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Equipment` ALTER COLUMN `locationId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Material` ALTER COLUMN `companyId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Product` ALTER COLUMN `companyId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `StorageCondition` ALTER COLUMN `companyId` DROP DEFAULT;
