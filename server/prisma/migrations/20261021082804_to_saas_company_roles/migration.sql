-- CreateTable
CREATE TABLE `UserCompanyRoles` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPERVISOR') NOT NULL DEFAULT 'EMPLOYEE',

    UNIQUE INDEX `UserCompanyRoles_userId_companyId_key`(`userId`, `companyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserCompanyRoles` ADD CONSTRAINT `UserCompanyRoles_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCompanyRoles` ADD CONSTRAINT `UserCompanyRoles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
