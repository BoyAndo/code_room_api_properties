import { PrismaClient } from "../../generated/prisma";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
} from "../../schemas/property.schema";

const prisma = new PrismaClient();

/**
 * Crea una nueva propiedad en la base de datos
 */
export const createProperty = async (
  propertyData: CreatePropertyInput,
  images: string[],
  utilityBillUrl: string,
  utilityBillValidated: boolean = false
) => {
  try {
    console.log("🏠 Creando nueva propiedad...");

    const property = await prisma.property.create({
      data: {
        landlordId: propertyData.landlordId,
        title: propertyData.title,
        description: propertyData.description,
        address: propertyData.address,
        comuna: propertyData.comuna,
        region: propertyData.region,
        zipCode: propertyData.zipCode,
        propertyType: propertyData.propertyType,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareMeters: propertyData.squareMeters,
        monthlyRent: propertyData.monthlyRent,
        images: JSON.stringify(images),
        utilityBillUrl,
        utilityBillValidated,
        amenities: propertyData.amenities
          ? JSON.stringify(propertyData.amenities)
          : null,
        rules: propertyData.rules,
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
      },
    });

    console.log("✅ Propiedad creada exitosamente:", property.id);
    return property;
  } catch (error) {
    console.error("❌ Error creando propiedad:", error);
    throw new Error(
      `Error creando propiedad: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

/**
 * Obtiene una propiedad por ID
 */
export const getPropertyById = async (id: number) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new Error("Propiedad no encontrada");
    }

    // Parsear campos JSON
    return {
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
    };
  } catch (error) {
    console.error("❌ Error obteniendo propiedad:", error);
    throw new Error(
      `Error obteniendo propiedad: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

/**
 * Obtiene propiedades con filtros
 */
export const getProperties = async (filters: PropertyFilters) => {
  try {
    const {
      comuna,
      region,
      propertyType,
      minRent,
      maxRent,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      isAvailable,
      landlordId,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (page - 1) * limit;

    // Construir condiciones de filtro
    const where: any = {};

    if (comuna) where.comuna = { contains: comuna, mode: "insensitive" };
    if (region) where.region = { contains: region, mode: "insensitive" };
    if (propertyType) where.propertyType = propertyType;
    if (landlordId) where.landlordId = landlordId;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;

    // Filtros de rango
    if (minRent || maxRent) {
      where.monthlyRent = {};
      if (minRent) where.monthlyRent.gte = minRent;
      if (maxRent) where.monthlyRent.lte = maxRent;
    }

    if (minBedrooms || maxBedrooms) {
      where.bedrooms = {};
      if (minBedrooms) where.bedrooms.gte = minBedrooms;
      if (maxBedrooms) where.bedrooms.lte = maxBedrooms;
    }

    if (minBathrooms || maxBathrooms) {
      where.bathrooms = {};
      if (minBathrooms) where.bathrooms.gte = minBathrooms;
      if (maxBathrooms) where.bathrooms.lte = maxBathrooms;
    }

    // Obtener propiedades y conteo total
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.property.count({ where }),
    ]);

    // Parsear campos JSON
    const parsedProperties = properties.map((property) => ({
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
    }));

    return {
      properties: parsedProperties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("❌ Error obteniendo propiedades:", error);
    throw new Error(
      `Error obteniendo propiedades: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

/**
 * Actualiza una propiedad
 */
export const updateProperty = async (updateData: UpdatePropertyInput) => {
  try {
    const { id, ...data } = updateData;

    // Preparar datos para actualización
    const updatePayload: any = { ...data };

    // Convertir amenities a JSON si se proporciona
    if (data.amenities) {
      updatePayload.amenities = JSON.stringify(data.amenities);
    }

    const property = await prisma.property.update({
      where: { id },
      data: updatePayload,
    });

    // Parsear campos JSON
    return {
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
    };
  } catch (error) {
    console.error("❌ Error actualizando propiedad:", error);
    throw new Error(
      `Error actualizando propiedad: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

/**
 * Elimina una propiedad
 */
export const deleteProperty = async (id: number) => {
  try {
    await prisma.property.delete({
      where: { id },
    });

    console.log("✅ Propiedad eliminada exitosamente:", id);
    return { message: "Propiedad eliminada exitosamente" };
  } catch (error) {
    console.error("❌ Error eliminando propiedad:", error);
    throw new Error(
      `Error eliminando propiedad: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

/**
 * Marca la factura de servicios como validada
 */
export const validateUtilityBill = async (propertyId: number) => {
  try {
    const property = await prisma.property.update({
      where: { id: propertyId },
      data: { utilityBillValidated: true },
    });

    console.log("✅ Factura de servicios validada para propiedad:", propertyId);
    return property;
  } catch (error) {
    console.error("❌ Error validando factura de servicios:", error);
    throw new Error(
      `Error validando factura de servicios: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};
