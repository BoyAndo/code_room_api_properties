-- CreateTable
CREATE TABLE `PropertyImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `altText` VARCHAR(255) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PropertyImage_propertyId_displayOrder_idx`(`propertyId`, `displayOrder`),
    INDEX `PropertyImage_propertyId_isPrimary_idx`(`propertyId`, `isPrimary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PropertyImage` ADD CONSTRAINT `PropertyImage_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
