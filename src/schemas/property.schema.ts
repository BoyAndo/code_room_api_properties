import { z } from "zod";

// Enum para tipos de propiedad
export const PropertyTypeEnum = z.enum(["APARTMENT", "HOUSE", "ROOM"]);

// Schema principal para crear una propiedad (compatible con form-data)
export const createPropertySchema = z.object({
  landlordId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error("El ID del landlord debe ser un número positivo");
      }
      return num;
    }),
  ]),
  landlordName: z
    .string()
    .min(2, "El nombre del landlord debe tener al menos 2 caracteres"),
  title: z
    .string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),
  description: z.string().optional(),
  address: z.string().min(10, "La dirección debe tener al menos 10 caracteres"),

  // Coordenadas para ubicación exacta en el mapa
  latitude: z
    .union([
      z.number().min(-56).max(-17),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("La latitud debe ser un número válido");
        }
        if (num < -56 || num > -17) {
          throw new Error("La latitud debe estar entre -56 y -17 (Chile)");
        }
        return num;
      }),
    ])
    .optional(),
  longitude: z
    .union([
      z.number().min(-75).max(-66),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("La longitud debe ser un número válido");
        }
        if (num < -75 || num > -66) {
          throw new Error("La longitud debe estar entre -75 y -66 (Chile)");
        }
        return num;
      }),
    ])
    .optional(),

  // Nombres para validación con Tesseract
  regionName: z.string().min(2, "El nombre de la región es requerido"),
  comunaName: z.string().min(2, "El nombre de la comuna es requerido"),

  // IDs para normalización en base de datos
  regionId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error("El ID de la región debe ser un número positivo");
      }
      return num;
    }),
  ]),
  comunaId: z.union([
    z.number().int().positive(),
    z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error("El ID de la comuna debe ser un número positivo");
      }
      return num;
    }),
  ]),
  propertyType: PropertyTypeEnum,
  bedrooms: z.union([
    z.number().int().min(0),
    z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) {
        throw new Error("El número de habitaciones no puede ser negativo");
      }
      return num;
    }),
  ]),
  bathrooms: z.union([
    z.number().int().min(0),
    z.string().transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) {
        throw new Error("El número de baños no puede ser negativo");
      }
      return num;
    }),
  ]),
  squareMeters: z
    .union([
      z.number().positive(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error("Los metros cuadrados deben ser un número positivo");
        }
        return num;
      }),
    ])
    .optional(),
  monthlyRent: z.union([
    z.number().positive(),
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        throw new Error("La renta mensual debe ser un número positivo");
      }
      return num;
    }),
  ]),
  amenities: z
    .union([
      z.array(z.number()),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return [];
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            // Convertir a números si es un array
            return parsed.map((item) => {
              const num = parseInt(item);
              if (isNaN(num)) {
                throw new Error(`Amenity ID inválido: ${item}`);
              }
              return num;
            });
          }
          // Si es un solo valor, convertir a número
          const num = parseInt(parsed);
          if (isNaN(num)) {
            throw new Error(`Amenity ID inválido: ${parsed}`);
          }
          return [num];
        } catch (error) {
          // Si no es JSON válido, dividir por comas y convertir a números
          return val
            .split(",")
            .map((item) => {
              const num = parseInt(item.trim());
              if (isNaN(num)) {
                throw new Error(`Amenity ID inválido: ${item.trim()}`);
              }
              return num;
            })
            .filter(Boolean);
        }
      }),
    ])
    .optional(),
});

// Schema para actualizar una propiedad (todos los campos opcionales excepto el ID)
// Compatible con form-data (igual que createPropertySchema)
export const updatePropertySchema = z.object({
  id: z.number().int().positive("El ID debe ser un número positivo"),
  landlordId: z
    .union([
      z.number().int().positive(),
      z.string().transform((val) => {
        const num = parseInt(val, 10);
        if (isNaN(num) || num <= 0) {
          throw new Error("El ID del landlord debe ser un número positivo");
        }
        return num;
      }),
    ])
    .optional(),
  landlordName: z.string().min(2).optional(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().optional(),
  address: z.string().min(10).optional(),

  // Coordenadas para ubicación exacta en el mapa
  latitude: z
    .union([
      z.number().min(-56).max(-17),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("La latitud debe ser un número válido");
        }
        if (num < -56 || num > -17) {
          throw new Error("La latitud debe estar entre -56 y -17 (Chile)");
        }
        return num;
      }),
    ])
    .optional(),
  longitude: z
    .union([
      z.number().min(-75).max(-66),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("La longitud debe ser un número válido");
        }
        if (num < -75 || num > -66) {
          throw new Error("La longitud debe estar entre -75 y -66 (Chile)");
        }
        return num;
      }),
    ])
    .optional(),

  // Nombres para validación con Tesseract (opcionales en actualización)
  regionName: z.string().min(2).optional(),
  comunaName: z.string().min(2).optional(),

  // IDs para normalización en base de datos
  regionId: z
    .union([
      z.number().int().positive(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseInt(val, 10);
        if (isNaN(num) || num <= 0) {
          throw new Error("El ID de la región debe ser un número positivo");
        }
        return num;
      }),
    ])
    .optional(),
  comunaId: z
    .union([
      z.number().int().positive(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseInt(val, 10);
        if (isNaN(num) || num <= 0) {
          throw new Error("El ID de la comuna debe ser un número positivo");
        }
        return num;
      }),
    ])
    .optional(),
  propertyType: PropertyTypeEnum.optional(),
  bedrooms: z
    .union([
      z.number().int().min(0),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 0) {
          throw new Error("El número de habitaciones no puede ser negativo");
        }
        return num;
      }),
    ])
    .optional(),
  bathrooms: z
    .union([
      z.number().int().min(0),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 0) {
          throw new Error("El número de baños no puede ser negativo");
        }
        return num;
      }),
    ])
    .optional(),
  squareMeters: z
    .union([
      z.number().positive(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error("Los metros cuadrados deben ser un número positivo");
        }
        return num;
      }),
    ])
    .optional(),
  monthlyRent: z
    .union([
      z.number().positive(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error("La renta mensual debe ser un número positivo");
        }
        return num;
      }),
    ])
    .optional(),
  isAvailable: z
    .union([
      z.boolean(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        return val.toLowerCase() === "true";
      }),
    ])
    .optional(),
  amenities: z
    .union([
      z.array(z.number()),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return [];
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            // Convertir a números si es un array
            return parsed.map((item) => {
              const num = parseInt(item);
              if (isNaN(num)) {
                throw new Error(`Amenity ID inválido: ${item}`);
              }
              return num;
            });
          }
          // Si es un solo valor, convertir a número
          const num = parseInt(parsed);
          if (isNaN(num)) {
            throw new Error(`Amenity ID inválido: ${parsed}`);
          }
          return [num];
        } catch (error) {
          // Si no es JSON válido, dividir por comas y convertir a números
          return val
            .split(",")
            .map((item) => {
              const num = parseInt(item.trim());
              if (isNaN(num)) {
                throw new Error(`Amenity ID inválido: ${item.trim()}`);
              }
              return num;
            })
            .filter(Boolean);
        }
      }),
    ])
    .optional(),
  images: z.array(z.string()).optional(), // Array de URLs de imágenes
  imagesToDelete: z
    .union([
      z.array(z.string()),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return [];
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }),
    ])
    .optional(), // Array de URLs de imágenes a eliminar
  replaceImages: z
    .union([
      z.boolean(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return false;
        return val.toLowerCase() === "true";
      }),
    ])
    .optional(), // Si true, reemplaza todas las imágenes; si false, agrega a las existentes
});

// Schema para filtros de búsqueda
export const propertyFiltersSchema = z.object({
  comuna: z.string().optional(),
  region: z.string().optional(),
  propertyType: PropertyTypeEnum.optional(),
  minRent: z.number().positive().optional(),
  maxRent: z.number().positive().optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().int().min(0).optional(),
  maxBathrooms: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  landlordId: z.number().int().positive().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
});

// Tipos TypeScript derivados de los schemas
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;
