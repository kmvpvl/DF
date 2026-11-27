/*
  Warnings:

  - The values [RESERVE] on the enum `Movement_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `orderNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderNumberInt` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[number]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberInt` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Order_orderNumber_key` ON `Order`;

-- AlterTable
ALTER TABLE `Movement` MODIFY `type` ENUM('PURCHASE', 'PRODUCTION', 'SALE', 'WRITE_OFF', 'RETURN', 'MOVE_IN', 'MOVE_OUT') NOT NULL;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `orderNumber`,
    DROP COLUMN `orderNumberInt`,
    ADD COLUMN `number` VARCHAR(191) NOT NULL,
    ADD COLUMN `numberInt` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Order_number_key` ON `Order`(`number`);
