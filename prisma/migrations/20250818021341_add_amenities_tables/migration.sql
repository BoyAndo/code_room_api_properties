/*
  Warnings:

  - You are about to drop the column `amenities` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Property` DROP COLUMN `amenities`;

-- CreateTable
CREATE TABLE `Amenity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(50) NULL,
    `category` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Amenity_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PropertyAmenity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `amenityId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PropertyAmenity_propertyId_idx`(`propertyId`),
    INDEX `PropertyAmenity_amenityId_idx`(`amenityId`),
    UNIQUE INDEX `PropertyAmenity_propertyId_amenityId_key`(`propertyId`, `amenityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PropertyAmenity` ADD CONSTRAINT `PropertyAmenity_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PropertyAmenity` ADD CONSTRAINT `PropertyAmenity_amenityId_fkey` FOREIGN KEY (`amenityId`) REFERENCES `Amenity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
