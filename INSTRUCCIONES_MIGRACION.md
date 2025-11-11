# Instrucciones para Agregar Columnas latitude y longitude

## Opción 1: Usando phpMyAdmin o MySQL Workbench (RECOMENDADO)

1. Abre **phpMyAdmin** o **MySQL Workbench**
2. Selecciona la base de datos `code_room`
3. Ejecuta el siguiente SQL:

```sql
ALTER TABLE `property` 
ADD COLUMN `latitude` DECIMAL(10, 8) NULL AFTER `utilityBillValidated`,
ADD COLUMN `longitude` DECIMAL(11, 8) NULL AFTER `latitude`;
```

4. Verifica que las columnas se agregaron correctamente:

```sql
DESCRIBE property;
```

## Opción 2: Usando la línea de comandos de MySQL

Si tienes MySQL en tu PATH, ejecuta:

```bash
mysql -u root -p
```

Luego dentro de MySQL:

```sql
USE code_room;

ALTER TABLE `property` 
ADD COLUMN `latitude` DECIMAL(10, 8) NULL AFTER `utilityBillValidated`,
ADD COLUMN `longitude` DECIMAL(11, 8) NULL AFTER `latitude`;

DESCRIBE property;
```

## Opción 3: Usando XAMPP MySQL

1. Abre XAMPP Control Panel
2. Click en "Shell" 
3. Ejecuta:

```bash
mysql -u root
```

4. Luego ejecuta:

```sql
USE code_room;

ALTER TABLE `property` 
ADD COLUMN `latitude` DECIMAL(10, 8) NULL AFTER `utilityBillValidated`,
ADD COLUMN `longitude` DECIMAL(11, 8) NULL AFTER `latitude`;

DESCRIBE property;
EXIT;
```

## Después de agregar las columnas

Una vez que hayas agregado las columnas en la base de datos, ejecuta:

```bash
cd code_room_api_properties
npx prisma generate
```

Esto regenerará el cliente de Prisma para que reconozca las nuevas columnas.

## Verificación

Las columnas deben verse así:

| Field                | Type          | Null | Key | Default | Extra          |
|---------------------|---------------|------|-----|---------|----------------|
| latitude            | decimal(10,8) | YES  |     | NULL    |                |
| longitude           | decimal(11,8) | YES  |     | NULL    |                |

¡Listo! Ahora tu backend puede guardar y leer las coordenadas de ubicación exactas.
