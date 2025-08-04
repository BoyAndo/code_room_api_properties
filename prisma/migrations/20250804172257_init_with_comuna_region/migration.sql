-- CreateTable
CREATE TABLE `Property` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `landlordId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `address` VARCHAR(191) NOT NULL,
    `comuna` VARCHAR(191) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `zipCode` VARCHAR(191) NULL,
    `propertyType` ENUM('APARTMENT', 'HOUSE', 'ROOM', 'STUDIO', 'COMMERCIAL') NOT NULL,
    `bedrooms` INTEGER NOT NULL,
    `bathrooms` INTEGER NOT NULL,
    `squareMeters` DOUBLE NULL,
    `monthlyRent` DECIMAL(10, 2) NOT NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `images` TEXT NULL,
    `utilityBillUrl` VARCHAR(191) NOT NULL,
    `utilityBillValidated` BOOLEAN NOT NULL DEFAULT false,
    `amenities` TEXT NULL,
    `rules` TEXT NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
