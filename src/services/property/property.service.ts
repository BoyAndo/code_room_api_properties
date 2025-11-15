// En property.service.ts

// 1. CORRECCIÓN EN LA IMPORTACIÓN: Importar 'Prisma' para acceder a la clase Decimal
import { PrismaClient, Prisma } from "../../generated/prisma";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
  CreatePropertyServiceInput,
} from "../../schemas/property.schema";
import { fetchLandlordsInfo } from "../landlord/landlord.service";

// 🆕 Obtener la clase Decimal directamente de Prisma
const Decimal = Prisma.Decimal;

// Inicializar prisma (esto permanece igual)
const prisma = new PrismaClient();

/**
 * Crea una nueva propiedad en la base de datos
 */
export const createProperty = async (
  propertyData: CreatePropertyServiceInput,
  images: string[],
  utilityBillUrl: string,
  utilityBillValidated: boolean = false
) => {
  try {
    console.log("🏠 Creando nueva propiedad...");

    // 2. CORRECCIÓN EN EL USO: Usar el constructor 'Decimal' que acabamos de importar
    // Ya no necesitas '(prisma as any)'
    const latitudeDecimal = new Decimal(propertyData.latitude);
    const longitudeDecimal = new Decimal(propertyData.longitude);

    const property = await prisma.property.create({
      data: {
        landlordId: propertyData.landlordId,
        title: propertyData.title,
        description: propertyData.description,
        address: propertyData.address,
        regionId: propertyData.regionId,
        comunaId: propertyData.comunaId,
        propertyType: propertyData.propertyType,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        squareMeters: propertyData.squareMeters,
        monthlyRent: propertyData.monthlyRent,
        utilityBillUrl,
        utilityBillValidated,
        // ✅ USANDO LOS OBJETOS DECIMAL CORREGIDOS
        latitude: latitudeDecimal,
        longitude: longitudeDecimal,
        // Crear las imágenes relacionadas
        propertyImages: {
          create: images.map((imageUrl, index) => ({
            imageUrl,
            displayOrder: index,
            isPrimary: index === 0,
            altText: `Imagen ${index + 1} de ${propertyData.title}`,
          })),
        },
        // Crear las relaciones con amenities si se proporcionan
        propertyAmenities: propertyData.amenities
          ? {
              create: propertyData.amenities.map((amenityId) => ({
                amenityId: amenityId,
              })),
            }
          : undefined,
      },
      include: {
        propertyImages: {
          orderBy: { displayOrder: "asc" },
        },
        propertyAmenities: {
          include: {
            amenity: true,
          },
        },
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
      include: {
        propertyImages: {
          orderBy: { displayOrder: "asc" },
        },
        propertyAmenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error("Propiedad no encontrada");
    }

    return {
      ...property,
      images: property.propertyImages.map((img) => img.imageUrl),
      amenities: property.propertyAmenities.map((pa) => pa.amenity),
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
 * Obtiene una propiedad por ID con información del landlord (OPTIMIZADO)
 */
export const getPropertyByIdWithLandlord = async (id: number) => {
  try {
    console.log(
      `🏠 Obteniendo propiedad ${id} con información del landlord...`
    );

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        propertyImages: {
          orderBy: { displayOrder: "asc" },
        },
        propertyAmenities: {
          include: {
            amenity: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error("Propiedad no encontrada");
    }

    // Obtener información del landlord
    const landlordsInfo = await fetchLandlordsInfo([property.landlordId]);
    const landlordInfo = landlordsInfo.length > 0 ? landlordsInfo[0] : null;

    console.log(`✅ Propiedad ${id} obtenida con información del landlord`);

    return {
      ...property,
      images: property.propertyImages.map((img) => img.imageUrl),
      amenities: property.propertyAmenities.map((pa) => pa.amenity),
      landlord: landlordInfo || {
        id: property.landlordId,
        landlordName: "Landlord no encontrado",
      },
    };
  } catch (error) {
    console.error("❌ Error obteniendo propiedad con landlord info:", error);
    throw new Error(
      `Error obteniendo propiedad con landlord info: ${
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
        include: {
          propertyImages: {
            orderBy: { displayOrder: "asc" },
          },
          propertyAmenities: {
            include: {
              amenity: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    // Parsear campos de forma segura
    const parsedProperties = properties.map((property) => {
      return {
        ...property,
        images: property.propertyImages.map((img) => img.imageUrl),
        amenities: property.propertyAmenities.map((pa) => pa.amenity),
      };
    });

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
 * Obtiene propiedades con información completa del landlord (OPTIMIZADO)
 * Esta función hace una sola llamada al microservicio de landlords para todos los propietarios
 */
// En property.service.ts

/**
 * Obtiene propiedades con información de landlords y PAGINACIÓN.
 * La cláusula 'where' y 'orderBy' es construida en el controlador.
 */
export const getPropertiesWithLandlordInfo = async (combinedFilters: any) => {
  try {
    // 1. Desestructurar los filtros del objeto combinado (incluye where, orderBy, page, limit)
    const {
      where,
      orderBy,
      page = 1, // Asumimos valores por defecto
      limit = 10,
    } = combinedFilters;

    const skip = (page - 1) * limit;

    // 2. Ejecutar la consulta con Prisma
    const properties = await prisma.property.findMany({
      where: where || {}, // ⬅️ USA EL OBJETO 'WHERE' DEL CONTROLADOR
      orderBy: orderBy || { createdAt: "desc" }, // ⬅️ USA EL OBJETO 'ORDERBY' DEL CONTROLADOR
      skip: skip,
      take: limit,

      // 3. Mantener la lógica de inclusiones
      include: {
        // Asumo que tu modelo 'Property' tiene el campo 'landlordId'
        // Landlord no se puede incluir directamente si está en otro servicio (fetchLandlordsInfo)
        propertyImages: {
          orderBy: { displayOrder: "asc" },
        },
        propertyAmenities: {
          include: {
            amenity: true,
          },
        },
        // ✅ INCLUIR RELACIONES DE COMUNA Y REGIÓN
        comuna: true,
        region: true,
      },
    });

    // 4. Obtener información de Landlords (Landlord Info Service)
    const landlordIds = properties.map((p) => p.landlordId);
    const uniqueLandlordIds = [...new Set(landlordIds)];
    const landlordsInfo = await fetchLandlordsInfo(uniqueLandlordIds);

    // 5. Mapear y devolver el resultado (similar a getPropertyByIdWithLandlord)
    const propertiesWithInfo = properties.map((property) => {
      const landlordInfo = landlordsInfo.find(
        (l) => l.id === property.landlordId
      ) || {
        id: property.landlordId,
        landlordName: "Landlord no encontrado",
      };

      return {
        ...property,
        // ✅ Agregar el nombre de comuna y región como strings para el frontend
        comunaName: property.comuna?.name || "",
        regionName: property.region?.name || "",
        images: property.propertyImages.map((img) => img.imageUrl),
        amenities: property.propertyAmenities.map((pa) => pa.amenity),
        landlord: landlordInfo,
      };
    });

    // 6. Obtener el total de propiedades para la paginación (con WHERE)
    const total = await prisma.property.count({ where: where || {} });

    return {
      properties: propertiesWithInfo,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("❌ Error obteniendo propiedades con landlord info:", error);
    throw new Error(
      `Error obteniendo propiedades con landlord info: ${
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
    console.log("🔄 Iniciando actualización de propiedad...");
    console.log("📋 Datos recibidos:", updateData);

    const {
      id,
      images,
      replaceImages,
      amenities,
      landlordId,
      landlordName,
      ...data
    } = updateData;

    // Preparar datos para actualización (sin landlordId ni landlordName)
    // El landlord no se puede cambiar en una actualización
    const updatePayload: any = { ...data };

    console.log("📤 Payload que se enviará a Prisma:", updatePayload);
    console.log("🆔 ID de propiedad a actualizar:", id);

    // Verificar que la propiedad existe antes de actualizar
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw new Error(`Propiedad con ID ${id} no encontrada`);
    }

    console.log("✅ Propiedad encontrada, procediendo con actualización...");

    // Actualizar la propiedad y las imágenes en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar los datos básicos de la propiedad
      const updatedProperty = await tx.property.update({
        where: { id },
        data: updatePayload,
      });

      // Manejar imágenes si se proporcionan
      if (images && images.length > 0) {
        if (replaceImages) {
          // Eliminar todas las imágenes existentes
          await tx.propertyImage.deleteMany({
            where: { propertyId: id },
          });
        }

        // Agregar las nuevas imágenes
        await tx.propertyImage.createMany({
          data: images.map((imageUrl, index) => ({
            propertyId: id,
            imageUrl,
            displayOrder: index,
            isPrimary: index === 0,
            altText: `Imagen ${index + 1} de ${updatedProperty.title}`,
          })),
        });
      }

      // Manejar amenities si se proporcionan
      if (amenities && amenities.length > 0) {
        // Eliminar todas las relaciones existentes de amenities
        await tx.propertyAmenity.deleteMany({
          where: { propertyId: id },
        });

        // Crear las nuevas relaciones con amenities
        await tx.propertyAmenity.createMany({
          data: amenities.map((amenityId) => ({
            propertyId: id,
            amenityId: amenityId,
          })),
        });

        console.log(
          `🏷️ Amenities actualizados: ${amenities.length} amenities asignados`
        );
      }

      // Obtener la propiedad actualizada con las imágenes
      return await tx.property.findUnique({
        where: { id },
        include: {
          propertyImages: {
            orderBy: { displayOrder: "asc" },
          },
          propertyAmenities: {
            include: {
              amenity: true,
            },
          },
        },
      });
    });

    if (!result) {
      throw new Error("Error obteniendo la propiedad actualizada");
    }

    console.log("✅ Propiedad actualizada en base de datos:", {
      id: result.id,
      title: result.title,
      monthlyRent: result.monthlyRent,
      isAvailable: result.isAvailable,
      updatedAt: result.updatedAt,
      imageCount: result.propertyImages.length,
      amenityCount: result.propertyAmenities.length,
    });

    const finalResult = {
      ...result,
      images: result.propertyImages.map((img) => img.imageUrl),
      amenities: result.propertyAmenities.map((pa) => pa.amenity),
    };

    console.log("📄 Resultado final preparado para respuesta");
    return finalResult;
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

/**
 * Obtiene todas las propiedades de un landlord específico
 */
export const getPropertiesByLandlordId = async (landlordId: number) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        landlordId: landlordId,
      },
      include: {
        region: true,
        comuna: true,
        propertyImages: true,
        propertyAmenities: {
          include: {
            amenity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Ordenar por más recientes primero
      },
    });

    // Transformar los datos para que sean consistentes con el formato esperado
    const transformedProperties = properties.map((property: any) => ({
      ...property,
      regionName: property.region?.name || property.regionName,
      comunaName: property.comuna?.name || property.comunaName,

      // Limpieza de campos (esto ya estaba bien)
      amenities: property.propertyAmenities.map((pa: any) => pa.amenity),
      propertyAmenities: undefined,
      region: undefined, // Opcional: remover el objeto de relación si no lo necesitas
      comuna: undefined, // Opcional: remover el objeto de relación si no lo necesitas
    }));

    return transformedProperties;
  } catch (error) {
    console.error(
      `❌ Error obteniendo propiedades del landlord ${landlordId}:`,
      error
    );
    throw new Error(
      `Error obteniendo propiedades del landlord: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};
