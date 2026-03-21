/*
  Warnings:

  - You are about to alter the column `cleaningType` on the `CleanAction` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - You are about to alter the column `entityType` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - Added the required column `supervisorId` to the `CleanAction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CleanAction` ADD COLUMN `supervisorId` VARCHAR(191) NOT NULL,
    MODIFY `cleaningType` ENUM('GENERAL', 'CURRENT', 'DISINFECTION') NOT NULL DEFAULT 'CURRENT';

-- AlterTable
ALTER TABLE `User` MODIFY `entityType` ENUM('INDIVIDUAL', 'LEGAL_ENTITY') NOT NULL DEFAULT 'INDIVIDUAL';

-- AddForeignKey
ALTER TABLE `CleanAction` ADD CONSTRAINT `CleanAction_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
