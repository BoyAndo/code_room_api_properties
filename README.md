# 🏠 Code Room API - Propiedades

API REST para el manejo de propiedades inmobiliarias del proyecto Code Room. Esta API permite a los landlords registrar propiedades con validación automática de facturas de servicios públicos usando OCR avanzado que verifica **nombre del propietario**, **dirección completa con numeración** y **comuna**.

## 🔧 Características

- ✅ **Validación Avanzada de Facturas**: OCR inteligente que valida 3 campos (nombre, dirección con números, comuna)
- 🧠 **OCR Inteligente**: Preprocesamiento de imágenes con múltiples técnicas y reconocimiento en español
- 📸 **Subida de Imágenes**: Soporte para múltiples imágenes de propiedades y facturas (hasta 10MB)
- 🔍 **Búsqueda Avanzada**: Filtros por comuna, región, precio, tipo de propiedad, etc.
- 🗄️ **Base de Datos**: MySQL con Prisma ORM y cliente generado customizado
- 📊 **Paginación**: Resultados paginados para mejor performance
- 🏷️ **Validación Robusta**: Schemas con Zod que manejan form-data y arrays
- 🏘️ **Localización Chilena**: Campos específicos para comuna y región
- 📍 **Detección de Números**: Reconoce numeración de direcciones en facturas

## 🛠️ Tecnologías

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Prisma** - ORM y migración de base de datos
- **Tesseract.js** - OCR para lectura de facturas
- **Sharp** - Procesamiento de imágenes
- **Zod** - Validación de schemas
- **Multer** - Manejo de archivos
- **AWS SDK** - Almacenamiento de archivos (S3/MinIO)

## 🚀 Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd code_room_api_properties
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Configurar base de datos**

```bash
# Ejecutar migraciones
npx prisma migrate dev

# Generar cliente de Prisma customizado
npx prisma generate
```

5. **Iniciar en desarrollo**

```bash
npm run dev
```

El servidor iniciará en el puerto configurado (por defecto 3002).

## 📋 Variables de Entorno

```env
# Servidor
PORT=3002

# Base de datos MySQL
DATABASE_URL="xxxxx://username:password@host:port/database_name"
MYSQL_USER="username"
MYSQL_PASSWORD="password"
MYSQL_DB="database_name"

# Claves JWT
PRIVATE_KEY_PATH="private.pem"
PUBLIC_KEY_PATH="public.pem"

# Configuración MinIO/S3
MINIO_ENDPOINT=
MINIO_USER="xxxxx"
MINIO_PASS="xxxxxx"
URL_S3="
URL_S3_CARNETS="
URL_S3_UTILITYBILLS="
URL_S3_PROPERTY_IMAGES=

# Configuración de desarrollo
NODE_ENV="development"
```

## 🔗 Endpoints

### Propiedades

| Método   | Endpoint              | Descripción                    |
| -------- | --------------------- | ------------------------------ |
| `POST`   | `/api/properties`     | Crear nueva propiedad          |
| `GET`    | `/api/properties`     | Listar propiedades con filtros |
| `GET`    | `/api/properties/:id` | Obtener propiedad específica   |
| `PUT`    | `/api/properties/:id` | Actualizar propiedad           |
| `DELETE` | `/api/properties/:id` | Eliminar propiedad             |

### Utilitarios

| Método | Endpoint  | Descripción                   |
| ------ | --------- | ----------------------------- |
| `GET`  | `/health` | Check de salud del servidor   |
| `GET`  | `/`       | Información general de la API |

## 📝 Uso de la API

### Crear Propiedad

```bash
POST /api/properties
Content-Type: multipart/form-data

# Campos del formulario:
{
  "landlordId": 1,
  "landlordName": "Juan Pérez",
  "title": "Departamento 2 dormitorios en Las Condes",
  "description": "Hermoso departamento...",
  "address": "Av. Providencia 1234, Las Condes",
  "comuna": "Las Condes",                    # ✨ NUEVO: Campo comuna
  "region": "Región Metropolitana",          # ✨ NUEVO: Campo región
  "zipCode": "7550000",
  "propertyType": "APARTMENT",
  "bedrooms": 2,
  "bathrooms": 2,
  "squareMeters": 85.5,
  "monthlyRent": 800000,
  "amenities": ["Piscina", "Gimnasio", "Estacionamiento"],  # Array o string separado por comas
  "rules": "No mascotas",
  "latitude": -33.4489,
  "longitude": -70.6693
}

# Archivos requeridos:
utilityBill: [archivo de factura de servicios - REQUERIDO]
propertyImages: [archivos de imágenes de la propiedad - OPCIONAL, máximo 10]
```

### Ejemplo con cURL

```bash
curl -X POST "http://localhost:3002/api/properties" \
  -F "landlordId=1" \
  -F "landlordName=Juan Pérez" \
  -F "title=Departamento en Las Condes" \
  -F "address=Av. Providencia 1234" \
  -F "comuna=Las Condes" \
  -F "region=Región Metropolitana" \
  -F "propertyType=APARTMENT" \
  -F "bedrooms=2" \
  -F "bathrooms=2" \
  -F "monthlyRent=800000" \
  -F "amenities[]=Piscina" \
  -F "amenities[]=Gimnasio" \
  -F "utilityBill=@/path/to/utility-bill.jpg" \
  -F "propertyImages=@/path/to/image1.jpg" \
  -F "propertyImages=@/path/to/image2.jpg"
```

### Manejo de Arrays en form-data

Los amenities se pueden enviar de múltiples formas:

```bash

# String separado por comas en el form-data
amenities=WiFi,Parking,Pool

```

### Listar Propiedades

```bash
# Búsqueda básica
GET /api/properties

# Con filtros
GET /api/properties?comuna=Las%20Condes&region=Metropolitana&minRent=500000&maxRent=1000000&page=1&limit=10

# Buscar por tipo de propiedad
GET /api/properties?propertyType=APARTMENT&bedrooms=2

# Buscar por landlord específico
GET /api/properties?landlordId=123&isAvailable=true
```

### Filtros Disponibles

- `comuna` - Comuna (ej: "Las Condes", "Providencia") ✨ **NUEVO**
- `region` - Región (ej: "Región Metropolitana", "Valparaíso") ✨ **NUEVO**
- `propertyType` - Tipo (APARTMENT, HOUSE, ROOM)
- `minRent`, `maxRent` - Rango de precio
- `minBedrooms`, `maxBedrooms` - Rango de dormitorios
- `minBathrooms`, `maxBathrooms` - Rango de baños
- `isAvailable` - Disponibilidad (true/false)
- `landlordId` - ID del propietario
- `page` - Página (default: 1)
- `limit` - Elementos por página (default: 10, max: 100)

## 🧾 Validación Avanzada de Facturas de Servicios

La API incluye un sistema **inteligente** de validación de facturas de servicios públicos que utiliza OCR avanzado con las siguientes características:

### 🎯 **Campos Validados (3 campos)**

1. **👤 Nombre del Landlord**: Debe coincidir con el nombre en el formulario
2. **📍 Dirección Completa**: Incluye números de calle, nombre de calle, y ubicación
3. **🏘️ Comuna**: Validación específica de la comuna chilena

### 🔧 **Proceso de Validación**

1. **📸 Preprocesamiento Avanzado**:

   - Redimensionado inteligente (hasta 3000px)
   - Mejora de contraste y brillo
   - Normalización y enfoque
   - Binarización para mejor OCR

2. **🧠 OCR Múltiple**:

   - 3 versiones procesadas de cada imagen
   - Reconocimiento en español (`spa.traineddata`)
   - Selección automática del mejor resultado
   - Algoritmo de scoring por confianza + longitud

3. **🔍 Validación Inteligente**:
   - **Nombres**: 70% de coincidencia requerida, mínimo 1 palabra
   - **Direcciones**: Reconoce números (peso 1.2x), maneja abreviaciones
   - **Comunas**: Flexible para abreviaciones comunes

### 📊 **Sistema de Confianza**

```javascript
// Distribución de confianza:
- Nombre del landlord: 35%
- Dirección completa:   40% (incluye números)
- Comuna:              25%

// Validación exitosa: Mínimo 2 de 3 campos encontrados
```

### ✅ **Requisitos para las Facturas**

- **📱 Formato**: JPG, PNG (máximo 10MB)
- **💡 Calidad**: Imagen clara, bien iluminada, sin sombras ni reflejos
- **📄 Contenido obligatorio**:
  - Nombre del propietario (como aparece en el formulario)
  - Dirección completa con numeración (ej: "Av. Providencia 1234")
  - Comuna claramente visible

### 🎯 **Ejemplo de Validación**

```typescript
// Datos del formulario:
{
  landlordName: "Juan Carlos Pérez González",
  propertyAddress: "Av. Providencia 1234, Las Condes",
  propertyComuna: "Las Condes"
}

// El OCR busca en la factura:
✅ "Juan", "Carlos", "Pérez" (nombre - 35% confianza)
✅ "Providencia", "1234" (dirección con número - 40% confianza)
✅ "Las Condes" o "L. Condes" (comuna - 25% confianza)

// Total: 100% confianza = ✅ VÁLIDA
```

### 🔧 **Algoritmos Especiales**

1. **🔢 Detección de Números**:

   - Mayor peso a números de dirección
   - Búsqueda exacta para numeración
   - Manejo de formatos chilenos

2. **📝 Normalización de Texto**:

   - Eliminación de tildes
   - Manejo de espacios múltiples
   - Conversión a minúsculas

3. **🎯 Coincidencias Parciales**:
   - Algoritmo de Levenshtein para typos
   - Detección de abreviaciones
   - Manejo de palabras contenidas

### ⚡ **Características Avanzadas**

- **🇨🇱 Optimizado para Chile**: Reconoce formatos de direcciones y comunas chilenas
- **🔄 Multiproceso**: 3 versiones de imagen procesadas en paralelo
- **📊 Logging Detallado**: Seguimiento completo del proceso de validación
- **🛡️ Tolerancia a Errores**: Maneja imágenes de calidad variable
- **⚙️ Configuración Flexible**: Umbrales ajustables por tipo de campo

## 🗃️ Estructura de Base de Datos

```prisma
model Property {
  id                    Int      @id @default(autoincrement())
  landlordId            Int      // Foreign key al landlord del otro microservicio
  title                 String
  description           String?  @db.Text
  address               String
  comuna                String   // ✨ NUEVO: Comuna chilena (antes "city")
  region                String   // ✨ NUEVO: Región chilena (antes "state")
  zipCode               String?
  propertyType          PropertyType // APARTMENT, HOUSE, ROOM, STUDIO, COMMERCIAL
  bedrooms              Int
  bathrooms             Int
  squareMeters          Float?
  monthlyRent           Decimal  @db.Decimal(10, 2)
  isAvailable          Boolean  @default(true)
  images                String?  @db.Text // JSON array de URLs
  utilityBillUrl        String   // URL de la cuenta de servicios validada
  utilityBillValidated  Boolean  @default(false) // ✨ Validación automática por OCR
  amenities             String?  @db.Text // JSON array ["Piscina", "Gimnasio"]
  rules                 String?  @db.Text
  latitude              Decimal? @db.Decimal(10, 8)
  longitude             Decimal? @db.Decimal(11, 8)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum PropertyType {
  APARTMENT   // Departamento
  HOUSE      // Casa
  ROOM       // Habitación
}
```

## 🔄 Integración con Code Room Register

Esta API está diseñada para integrarse perfectamente con el sistema de registro de landlords de Code Room:

### 🔗 **Conexión con Microservicio de Registro**

- **landlordId**: Referencia al landlord registrado en `code_room_api_register`
- **Validación Consistente**: Utiliza la misma lógica de OCR y validación de documentos
- **Estándares Compartidos**: Mantiene los mismos niveles de calidad y confianza

### 📋 **Flujo de Integración**

1. **Registro de Landlord** (en `code_room_api_register`):

   ```
   Landlord registra → Valida carnet + cuenta servicios → Obtiene landlordId
   ```

2. **Registro de Propiedades** (en esta API):
   ```
   Usa landlordId → Valida cuenta servicios de propiedad → Crea propiedad
   ```

### 🧾 **Diferencias en Validación OCR**

| Campo         | API Register           | API Properties                    |
| ------------- | ---------------------- | --------------------------------- |
| **Nombre**    | ✅ Nombre del landlord | ✅ Nombre del landlord            |
| **Documento** | ✅ RUT del carnet      | ❌ No aplica                      |
| **Dirección** | ✅ Dirección personal  | ✅ Dirección de propiedad         |
| **Comuna**    | ❌ No aplica           | ✅ **NUEVO**: Comuna de propiedad |

### 🔧 **Configuración Compartida**

Ambas APIs utilizan:

- **Tesseract.js** con `spa.traineddata`
- **Sharp** para preprocesamiento de imágenes
- **Mismos algoritmos** de normalización y coincidencia
- **Sistema de confianza** similar pero adaptado

### 🎯 **Ejemplo de Uso Conjunto**

```javascript
// 1. En code_room_api_register
POST /api/landlords/register
{
  landlordName: "Juan Pérez",
  landlordAddress: "Los Leones 1234, Providencia",
  // ... otros campos
}
// Respuesta: { landlordId: 123, ... }

// 2. En code_room_api_properties
POST /api/properties
{
  landlordId: 123,                    // ← Del registro anterior
  landlordName: "Juan Pérez",         // ← Mismo nombre
  address: "Av. Kennedy 5600",        // ← Dirección de LA PROPIEDAD
  comuna: "Las Condes",               // ← Comuna de LA PROPIEDAD
  // ... otros campos
}
```

### ⚙️ **Variables de Entorno Compartidas**

```env
# MinIO/S3 (compartido entre ambas APIs)
MINIO_ENDPOINT=
URL_S3_UTILITYBILLS=

# Base de datos (separadas pero relacionadas)
# API Register
DATABASE_URL= mysql aws
# API Properties
DATABASE_URL= mysql aws
```

## 🧪 Testing

### 🔧 **Estado del Servidor**

```bash
# Verificar que el servidor esté funcionando
curl http://localhost:3002/health

# Respuesta esperada:
{
  "success": true,
  "message": "API de propiedades Code Room funcionando correctamente",
  "timestamp": "2025-08-04T17:22:57.000Z"
}
```

### 📱 **Postman**

1. **Configurar ambiente**:

   ```json
   {
     "baseUrl": "http://localhost:3002",
     "port": "3002"
   }
   ```

2. **Headers para form-data**:

   ```
   Content-Type: multipart/form-data
   ```

3. **Archivos de prueba**: Usa facturas reales con nombre y dirección visibles

### 💻 **Ejemplos de cURL**

```bash
# 1. Listar todas las propiedades
curl -X GET "http://localhost:3002/api/properties"

# 2. Buscar por comuna y rango de precio
curl -X GET "http://localhost:3002/api/properties?comuna=Las%20Condes&minRent=500000&maxRent=1500000"

# 3. Crear propiedad completa
curl -X POST "http://localhost:3002/api/properties" \
  -F "landlordId=1" \
  -F "landlordName=María González" \
  -F "title=Departamento 3D 2B en Las Condes" \
  -F "description=Hermoso departamento con vista a la montaña" \
  -F "address=Av. Kennedy 5600" \
  -F "comuna=Las Condes" \
  -F "region=Región Metropolitana" \
  -F "zipCode=7550000" \
  -F "propertyType=APARTMENT" \
  -F "bedrooms=3" \
  -F "bathrooms=2" \
  -F "squareMeters=95.5" \
  -F "monthlyRent=1200000" \
  -F "amenities[]=Piscina" \
  -F "amenities[]=Gimnasio" \
  -F "amenities[]=Estacionamiento" \
  -F "rules=No mascotas. No fumadores." \
  -F "utilityBill=@./test-files/factura-servicios.jpg" \
  -F "propertyImages=@./test-files/living.jpg" \
  -F "propertyImages=@./test-files/kitchen.jpg"

# 4. Obtener propiedad específica
curl -X GET "http://localhost:3002/api/properties/1"

# 5. Actualizar propiedad
curl -X PUT "http://localhost:3002/api/properties/1" \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyRent": 1300000,
    "isAvailable": false,
    "amenities": ["Piscina", "Gimnasio", "Estacionamiento", "Terraza"]
  }'
```

### 🧪 **Casos de Prueba OCR**

Para probar la validación de facturas:

```bash
# ✅ Caso exitoso - Todos los datos coinciden
curl -X POST "http://localhost:3002/api/properties" \
  -F "landlordName=Juan Pérez" \
  -F "address=Av. Providencia 1234" \
  -F "comuna=Providencia" \
  -F "utilityBill=@factura-con-datos-correctos.jpg" \
  # ... otros campos

# ❌ Caso de error - Datos no coinciden
curl -X POST "http://localhost:3002/api/properties" \
  -F "landlordName=María González" \
  -F "address=Av. Kennedy 5600" \
  -F "comuna=Las Condes" \
  -F "utilityBill=@factura-con-otros-datos.jpg" \
  # ... otros campos
```

### 📊 **Respuestas de Ejemplo**

**✅ Creación exitosa:**

```json
{
  "success": true,
  "message": "Propiedad creada exitosamente",
  "data": {
    "id": 1,
    "title": "Departamento 3D 2B en Las Condes",
    "address": "Av. Kennedy 5600",
    "comuna": "Las Condes",
    "region": "Región Metropolitana",
    "utilityBillValidated": true,
    "confidence": 85
  }
}
```

**❌ Error de validación:**

```json
{
  "success": false,
  "message": "Los datos de la cuenta de servicios no coinciden: No se encontró: dirección de la propiedad, comuna.",
  "details": {
    "form": {
      "landlordName": "María González",
      "propertyAddress": "Av. Kennedy 5600",
      "propertyComuna": "Las Condes"
    },
    "matchDetails": {
      "nameFound": true,
      "addressFound": false,
      "comunaFound": false
    },
    "confidence": 35,
    "suggestion": "Asegúrate de que la cuenta de servicios contenga el nombre del propietario, la dirección completa con números, y la comuna de la propiedad."
  }
}
```

## 📁 Estructura del Proyecto

```
src/
├── controllers/           # Controladores de rutas
│   └── propertyController.ts    # ✅ Manejo completo de propiedades + OCR
├── middlewares/          # Middlewares personalizados
│   └── multer.ts        # ✅ Configuración para archivos (imágenes + facturas)
├── routes/              # Definición de rutas REST
│   └── propertyRoutes.ts # ✅ Rutas CRUD completas
├── schemas/             # Validación con Zod
│   └── property.schema.ts # ✅ Validación robusta con form-data
├── services/            # Lógica de negocio
│   ├── property/        # Servicios específicos de propiedades
│   │   ├── property.service.ts           # ✅ CRUD con campos comuna/region
│   │   ├── extractUtilityBillInfo.ts     # ✅ Servicio principal OCR
│   │   └── readUtilityBillFromImage.ts   # ✅ OCR avanzado 3 campos
│   └── shared/          # Servicios compartidos
│       ├── s3Service.ts # ✅ Subida de archivos (S3/MinIO)
│       └── normalize.ts # ✅ Normalización de texto para OCR
├── generated/           # Cliente Prisma generado
│   └── prisma/         # ✅ Cliente customizado con comuna/region
├── app.ts              # ✅ Configuración Express + middlewares + rutas
└── server.ts           # ✅ Punto de entrada del servidor
prisma/
├── schema.prisma       # ✅ Modelo actualizado con comuna/region
└── migrations/         # ✅ Migraciones de base de datos
    └── 20250804172257_init_with_comuna_region/
        └── migration.sql
```

### 🔧 **Archivos Clave Implementados**

1. **🏠 propertyController.ts**:

   - Validación completa con 3 campos OCR
   - Manejo de errores detallado
   - Subida de múltiples archivos

2. **🧠 readUtilityBillFromImage.ts**:

   - OCR con 3 versiones de imagen procesadas
   - Algoritmos específicos para nombres, direcciones y comunas
   - Sistema de scoring inteligente

3. **📋 property.schema.ts**:

   - Validación flexible para form-data
   - Transformaciones automáticas de tipos
   - Manejo de arrays en múltiples formatos

4. **🗄️ property.service.ts**:
   - CRUD completo con nuevos campos
   - Filtros por comuna y región
   - Parseo automático de JSON

### 🚀 **Características Implementadas**

- ✅ **Sistema OCR completo** con validación de 3 campos
- ✅ **Base de datos actualizada** con campos chilenos
- ✅ **API REST completa** con todos los endpoints
- ✅ **Validación robusta** que maneja form-data
- ✅ **Subida de archivos** a S3/MinIO
- ✅ **Filtros avanzados** por ubicación y características
- ✅ **Manejo de errores** con mensajes detallados
- ✅ **Logging completo** para debugging

## 🛠️ Troubleshooting

### ❌ **Errores Comunes**

#### 1. **OCR no reconoce la factura**

```bash
# Verificar:
✅ Imagen clara y bien iluminada
✅ Texto legible sin sombras
✅ Formato JPG/PNG válido
✅ Tamaño menor a 10MB
✅ Nombre exacto como en formulario
✅ Dirección con numeración visible
✅ Comuna claramente escrita
```

### 🔧 **Comandos de Diagnóstico**

```bash
# Verificar estado del servidor
curl http://localhost:3002/health

# Verificar base de datos
npx prisma db pull
npx prisma db push

# Limpiar y regenerar todo
npx prisma migrate reset --force
npx prisma migrate dev --name init-with-comuna-region
npx prisma generate

# Verificar dependencias
npm list tesseract.js sharp multer
```

### 📊 **Logs de Debugging**

El sistema incluye logging detallado:

```bash
# En consola verás:
🧾 Iniciando validación de cuenta de servicios para propiedad...
📸 Iniciando preprocesamiento avanzado...
📊 Comparando resultados OCR:
👤 Buscando nombre en texto extraído...
🔍 Buscando dirección en texto extraído...
🏘️ Buscando comuna en texto extraído...
✅ Validación exitosa / ❌ Validación fallida
```

## ❓ FAQ

### **¿Qué pasa si solo 2 de 3 campos coinciden en el OCR?**

La propiedad se considera válida. El sistema requiere mínimo 2 de 3 campos (nombre, dirección, comuna) para aprobar la validación.

### **¿Puedo subir propiedades sin factura de servicios?**

No, la factura es obligatoria para validar que el landlord efectivamente tiene acceso/propiedad del inmueble.

### **¿Qué formatos de imagen acepta?**

JPG, PNG hasta 10MB. Se recomienda resolución alta y buena iluminación para mejor OCR.

### **¿El OCR funciona con facturas de todas las empresas?**

Está optimizado para facturas chilenas estándar. Puede requerir ajustes para formatos muy específicos, lo ideal es especificar que se vea nombre de dueño y dirección del domicilio, estos deben coincidir con los datos del mismo arrendador (landlord).

### **¿Cómo integro con el sistema de autenticación?**

Actualmente la API es abierta. Se debe agregar para futuro la autorización y autenticación agregando el middleware de JWT usando las claves configuradas en `PRIVATE_KEY_PATH` y `PUBLIC_KEY_PATH`.

## 📄 Licencia

Este proyecto está bajo licencia privada y es parte del proyecto de mi proyecto de título.

## 👨‍💻 Autor

**Ivan Duarte Herrera**

- Proyecto Code Room - API de Propiedades
- Integración con sistema de registro de landlords
- Validación OCR avanzada para facturas de servicios

---

## 🚀 **Estado del Proyecto: ✅ COMPLETAMENTE FUNCIONAL**

- ✅ API REST completa implementada
- ✅ Base de datos con campos chilenos (comuna/región)
- ✅ OCR avanzado con validación de 3 campos
- ✅ Subida de archivos a S3/MinIO
- ✅ Validación robusta con Zod
- ✅ Filtros y búsqueda avanzada
- ✅ Integración lista con sistema de registro
- ✅ Documentación completa
- ✅ Ejemplos de uso y testing

**Versión**: 1.0.0  
**Última actualización**: Agosto 2025
**Cambios pendientes**: Agregar validación en la creación de properties
