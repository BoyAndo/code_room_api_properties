-- Archivo: seed-chile-locations.sql

-- Insertar regiones
INSERT INTO `region` (`id`, `code`, `name`, `createdAt`, `updatedAt`) VALUES
(1, 'XV', 'Arica y Parinacota', NOW(), NOW()),
(2, 'I', 'Tarapacá', NOW(), NOW()),
(3, 'II', 'Antofagasta', NOW(), NOW()),
(4, 'III', 'Atacama', NOW(), NOW()),
(5, 'IV', 'Coquimbo', NOW(), NOW()),
(6, 'V', 'Valparaíso', NOW(), NOW()),
(7, 'RM', 'Metropolitana de Santiago', NOW(), NOW()),
(8, 'VI', 'O\'Higgins', NOW(), NOW()),
(9, 'VII', 'Maule', NOW(), NOW()),
(10, 'XVI', 'Ñuble', NOW(), NOW()),
(11, 'VIII', 'Biobío', NOW(), NOW()),
(12, 'IX', 'La Araucanía', NOW(), NOW()),
(13, 'XIV', 'Los Ríos', NOW(), NOW()),
(14, 'X', 'Los Lagos', NOW(), NOW()),
(15, 'XI', 'Aysén', NOW(), NOW()),
(16, 'XII', 'Magallanes', NOW(), NOW());

-- Insertar algunas comunas de ejemplo para la Región Metropolitana (id = 7)
INSERT INTO `comuna` (`name`, `regionId`, `createdAt`, `updatedAt`) VALUES
('Santiago', 7, NOW(), NOW()),
('Providencia', 7, NOW(), NOW()),
('Las Condes', 7, NOW(), NOW()),
('Ñuñoa', 7, NOW(), NOW()),
('La Florida', 7, NOW(), NOW()),
('Maipú', 7, NOW(), NOW()),
('Puente Alto', 7, NOW(), NOW()),
('La Reina', 7, NOW(), NOW()),
('Vitacura', 7, NOW(), NOW()),
('San Miguel', 7, NOW(), NOW());

-- Insertar algunas comunas de ejemplo para la Región de Valparaíso (id = 6)
INSERT INTO `comuna` (`name`, `regionId`, `createdAt`, `updatedAt`) VALUES
('Valparaíso', 6, NOW(), NOW()),
('Viña del Mar', 6, NOW(), NOW()),
('Concón', 6, NOW(), NOW()),
('Quilpué', 6, NOW(), NOW()),
('Villa Alemana', 6, NOW(), NOW());