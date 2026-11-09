/*
  Warnings:

  - Added the required column `price` to the `OrderProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `OrderProduct` ADD COLUMN `price` DOUBLE NOT NULL,
    ADD COLUMN `variationLabel` JSON NULL;
