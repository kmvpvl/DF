/*
  Warnings:

  - Added the required column `userId` to the `MovementGroup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Movement` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `MovementGroup` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Movement` ADD CONSTRAINT `Movement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovementGroup` ADD CONSTRAINT `MovementGroup_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
