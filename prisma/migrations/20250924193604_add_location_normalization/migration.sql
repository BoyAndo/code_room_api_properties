/*
  Warnings:

  - You are about to drop the column `comuna` on the `property` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `property` table. All the data in the column will be lost.
  - Added the required column `comunaId` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regionId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `landlord` ADD COLUMN `comunaId` INTEGER NULL,
    ADD COLUMN `regionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `property` DROP COLUMN `comuna`,
    DROP COLUMN `region`,
    ADD COLUMN `comunaId` INTEGER NOT NULL,
    ADD COLUMN `regionId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `student` ADD COLUMN `comunaId` INTEGER NULL,
    ADD COLUMN `regionId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Region` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(10) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Region_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comuna` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `regionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comuna_regionId_idx`(`regionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Landlord_regionId_idx` ON `Landlord`(`regionId`);

-- CreateIndex
CREATE INDEX `Landlord_comunaId_idx` ON `Landlord`(`comunaId`);

-- CreateIndex
CREATE INDEX `Property_regionId_idx` ON `Property`(`regionId`);

-- CreateIndex
CREATE INDEX `Property_comunaId_idx` ON `Property`(`comunaId`);

-- CreateIndex
CREATE INDEX `Student_regionId_idx` ON `Student`(`regionId`);

-- CreateIndex
CREATE INDEX `Student_comunaId_idx` ON `Student`(`comunaId`);

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_comunaId_fkey` FOREIGN KEY (`comunaId`) REFERENCES `Comuna`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Landlord` ADD CONSTRAINT `Landlord_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Landlord` ADD CONSTRAINT `Landlord_comunaId_fkey` FOREIGN KEY (`comunaId`) REFERENCES `Comuna`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comuna` ADD CONSTRAINT `Comuna_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_comunaId_fkey` FOREIGN KEY (`comunaId`) REFERENCES `Comuna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
