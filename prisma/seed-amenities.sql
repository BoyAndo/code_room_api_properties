-- Script para poblar la tabla Amenity con amenities comunes en propiedades chilenas
-- Ejecutar este script en MySQL Workbench

INSERT INTO code_room.amenity (`name`, `description`, `icon`, `category`, `createdAt`, `updatedAt`) VALUES

-- SERVICIOS BÁSICOS / UTILITIES
('WiFi', 'Conexión a internet inalámbrica', 'wifi', 'utilities', NOW(), NOW()),
('Cable TV', 'Televisión por cable con canales premium', 'tv', 'utilities', NOW(), NOW()),
('Agua Caliente', 'Suministro de agua caliente las 24 horas', 'droplet', 'utilities', NOW(), NOW()),
('Calefacción', 'Sistema de calefacción central o individual', 'thermometer', 'utilities', NOW(), NOW()),
('Gas Natural', 'Conexión a gas natural para cocina y calefacción', 'flame', 'utilities', NOW(), NOW()),

-- ELECTRODOMÉSTICOS / APPLIANCES  
('Refrigerador', 'Refrigerador incluido en la propiedad', 'archive', 'appliances', NOW(), NOW()),
('Lavadora', 'Lavadora automática disponible', 'refresh-cw', 'appliances', NOW(), NOW()),
('Microondas', 'Horno microondas incluido', 'zap', 'appliances', NOW(), NOW()),
('Aire Acondicionado', 'Sistema de aire acondicionado', 'wind', 'appliances', NOW(), NOW()),
('Lavavajillas', 'Lavavajillas automático', 'droplets', 'appliances', NOW(), NOW()),

-- MOBILIARIO / FURNITURE
('Amoblado', 'Completamente amoblado con muebles básicos', 'home', 'furniture', NOW(), NOW()),
('Semi-amoblado', 'Parcialmente amoblado con algunos muebles', 'package', 'furniture', NOW(), NOW()),
('Camas', 'Camas con colchones incluidos', 'moon', 'furniture', NOW(), NOW()),
('Escritorio', 'Escritorio para estudio o trabajo', 'edit-3', 'furniture', NOW(), NOW()),
('Closet', 'Closet o armario empotrado', 'folder', 'furniture', NOW(), NOW()),

-- SEGURIDAD / SECURITY
('Portero', 'Servicio de portería 24 horas', 'shield', 'security', NOW(), NOW()),
('Cámaras de Seguridad', 'Sistema de videovigilancia', 'camera', 'security', NOW(), NOW()),
('Acceso Controlado', 'Control de acceso con tarjeta o código', 'key', 'security', NOW(), NOW()),
('Reja de Seguridad', 'Rejas en ventanas y puertas', 'lock', 'security', NOW(), NOW()),
('Alarma', 'Sistema de alarma contra robos', 'alert-triangle', 'security', NOW(), NOW()),

-- RECREACIÓN / RECREATION
('Piscina', 'Acceso a piscina comunitaria o privada', 'droplet', 'recreation', NOW(), NOW()),
('Gimnasio', 'Gimnasio en el edificio o complejo', 'activity', 'recreation', NOW(), NOW()),
('Quincho', 'Área de quincho para asados', 'sun', 'recreation', NOW(), NOW()),
('Jardín', 'Área verde o jardín privado/comunitario', 'flower', 'recreation', NOW(), NOW()),
('Terraza', 'Terraza privada o balcón', 'maximize-2', 'recreation', NOW(), NOW()),

-- TRANSPORTE / TRANSPORT
('Estacionamiento', 'Plaza de estacionamiento asignada', 'truck', 'transport', NOW(), NOW()),
('Cerca del Metro', 'A menos de 10 minutos caminando del metro', 'map-pin', 'transport', NOW(), NOW()),
('Locomoción Cerca', 'Fácil acceso a transporte público', 'navigation', 'transport', NOW(), NOW()),
('Bodega', 'Bodega o espacio de almacenamiento', 'archive', 'transport', NOW(), NOW()),

-- SERVICIOS ADICIONALES / ADDITIONAL
('Conserje', 'Servicio de conserjería', 'user', 'additional', NOW(), NOW()),
('Ascensor', 'Acceso por ascensor', 'arrow-up', 'additional', NOW(), NOW()),
('Mascotas Permitidas', 'Se permiten mascotas en la propiedad', 'heart', 'additional', NOW(), NOW()),
('Balcón', 'Balcón privado con vista', 'eye', 'additional', NOW(), NOW()),
('Vista al Mar/Ciudad', 'Vista panorámica desde la propiedad', 'camera', 'additional', NOW(), NOW());