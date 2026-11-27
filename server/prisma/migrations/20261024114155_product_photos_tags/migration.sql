/*
  Warnings:

  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Product` 
    ADD COLUMN `photos` JSON NOT NULL DEFAULT (JSON_ARRAY()),
    ADD COLUMN `tags` JSON NOT NULL DEFAULT (JSON_ARRAY());