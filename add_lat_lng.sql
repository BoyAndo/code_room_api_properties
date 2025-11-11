-- Agregar columnas latitude y longitude a la tabla property
ALTER TABLE `property` 
ADD COLUMN `latitude` DECIMAL(10, 8) NULL AFTER `utilityBillValidated`,
ADD COLUMN `longitude` DECIMAL(11, 8) NULL AFTER `latitude`;
