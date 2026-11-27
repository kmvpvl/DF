/*
  Warnings:

  - You are about to drop the column `fromLocationId` on the `MovementGroup` table. All the data in the column will be lost.
  - You are about to drop the column `toLocationId` on the `MovementGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Movement` MODIFY `type` ENUM('PURCHASE', 'PRODUCTION', 'SALE', 'WRITE_OFF', 'RETURN', 'MOVE_IN', 'MOVE_OUT', 'RESERVE') NOT NULL;

-- AlterTable
ALTER TABLE `MovementGroup` DROP COLUMN `fromLocationId`,
    DROP COLUMN `toLocationId`,
    ADD COLUMN `label` VARCHAR(191) NULL;
