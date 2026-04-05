-- CreateTable
CREATE TABLE `CostSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `marginalCoefficient` DOUBLE NOT NULL DEFAULT 1.0,
    `containerCost` DOUBLE NOT NULL DEFAULT 0.0,
    `productVat` DOUBLE NOT NULL DEFAULT 20.0,
    `productWeight` DOUBLE NOT NULL DEFAULT 100.0,
    `productContainerCosts` JSON NOT NULL,
    `productMarginalCoefficients` JSON NOT NULL,
    `productWeights` JSON NOT NULL,
    `productVats` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
