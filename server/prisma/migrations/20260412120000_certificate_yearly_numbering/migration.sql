-- CreateTable
CREATE TABLE `Certificate` (
    `id` VARCHAR(191) NOT NULL,
    `numberYear` INTEGER NOT NULL,
    `number` INTEGER NOT NULL,
    `numberStr` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `extraCertificateData` TEXT NOT NULL,

    UNIQUE INDEX `Certificate_numberStr_key`(`numberStr`),
    UNIQUE INDEX `Certificate_batchId_key`(`batchId`),
    UNIQUE INDEX `Certificate_numberYear_number_key`(`numberYear`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Certificate`
  ADD CONSTRAINT `Certificate_batchId_fkey`
  FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
