/*
  Warnings:

  - Made the column `description` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Product` 
    ADD COLUMN `descriptionJson` JSON NOT NULL,
    ADD COLUMN `nameJson` JSON NOT NULL,
    MODIFY `description` VARCHAR(191) NOT NULL DEFAULT '';

UPDATE `Product`
SET 
    nameJson = JSON_OBJECT(
        'default', name, 
        'ts', JSON_OBJECT()
    ),
    descriptionJson = JSON_OBJECT(
        'default', description, 
        'ts', JSON_OBJECT()
    )
