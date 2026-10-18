/*
  Warnings:

  - You are about to drop the column `OrderNumberInt` on the `Order` table. All the data in the column will be lost.
  - Made the column `storageDurationDays` on table `Batch` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `orderNumberInt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `sortOrder` on table `OrderProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Batch` MODIFY `storageDurationDays` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Material` MODIFY `rateOfLoss` DOUBLE NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE `Order` 
    ADD COLUMN `deliveryAddress` VARCHAR(191) NULL,
    ADD COLUMN `isPaid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `managerId` VARCHAR(191) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `orderNumberInt` INTEGER NOT NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `shippingMethod` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `totalPrice` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `trackingNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `OrderProduct` 
    ADD COLUMN `sortOrder` INTEGER NOT NULL;
