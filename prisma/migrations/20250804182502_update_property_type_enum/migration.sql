/*
  Warnings:

  - The values [STUDIO,COMMERCIAL] on the enum `Property_propertyType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Property` MODIFY `propertyType` ENUM('APARTMENT', 'HOUSE', 'ROOM') NOT NULL;
