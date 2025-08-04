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
  comuna: z.string().min(2, "La comuna debe tener al menos 2 caracteres"),
  region: z.string().min(2, "La región debe tener al menos 2 caracteres"),
  zipCode: z.string().optional(),
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
      z.array(z.string()),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return [];
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val];
        } catch {
          // Si no es JSON válido, dividir por comas
          return val
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      }),
    ])
    .optional(),
  rules: z.string().optional(),
  latitude: z
    .union([
      z.number(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("La latitud debe ser un número válido");
        }
        return num;
      }),
    ])
    .optional(),
  longitude: z
    .union([
      z.number(),
      z.string().transform((val) => {
        if (!val || val.trim() === "") return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("La longitud debe ser un número válido");
        }
        return num;
      }),
    ])
    .optional(),
});

// Schema para actualizar una propiedad (todos los campos opcionales excepto el ID)
export const updatePropertySchema = z.object({
  id: z.number().int().positive("El ID debe ser un número positivo"),
  landlordId: z.number().int().positive().optional(),
  landlordName: z.string().min(2).optional(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().optional(),
  address: z.string().min(10).optional(),
  comuna: z.string().min(2).optional(),
  region: z.string().min(2).optional(),
  zipCode: z.string().optional(),
  propertyType: PropertyTypeEnum.optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  squareMeters: z.number().positive().optional(),
  monthlyRent: z.number().positive().optional(),
  isAvailable: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  rules: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
