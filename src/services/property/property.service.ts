import { PrismaClient } from "../../generated/prisma";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
} from "../../schemas/property.schema";
import { fetchLandlordsInfo } from "../landlord/landlord.service";

const prisma = new PrismaClient();

/**
 * Cre    cons    //        // Preparar datos para actualización
    const updatePayload: any = { ...data };

    console.log("📤 Payload que se enviará a Prisma:", updatePayload);
    console.log("🆔 ID de propiedad a actualizar:", id);

    // Verificar que la propiedad existe antes de actualizarog("📤 Payload que se enviará a Prisma:", updatePayload);
    console.log("🆔 ID de propiedad a actualizar:", id);

    // Verificar que la propiedad existe antes de actualizarog("📤 Payload que se enviará a Prisma:", updatePayload);
    console.log("🆔 ID de propiedad a actualizar:", id);

    // Verificar que la propiedad existe antes de actualizaratos para actualización
    const updatePayload: any = { ...data };

    console.log("📤 Payload que se enviará a Prisma:", updatePayload);
    console.log("🆔 ID de propiedad a actualizar:", id);ges, replaceImages, amenities, ...data } = updateData;

    // Preparar datos para actualización
    const updatePayload: any = { ...data };

    console.log("📤 Payload que se enviará a Prisma:", updatePayload);
    console.log("🆔 ID de propiedad a actualizar:", id);ropiedad en la base de datos
 */
export const createProperty = async (
  propertyData: CreatePropertyInput,
  images: string[],
  utilityBillUrl: string,
  utilityBillValidated: boolean = false
) => {
  try {
    console.log("🏠 Creando nueva propiedad...");

    // Preparar los datos base
    const propertyCreateData: any = {
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
      updatedAt: new Date(), // Campo requerido por Prisma
      // Crear las imágenes relacionadas (nota: usar propertyimage en minúscula)
      propertyimage: {
        create: images.map((imageUrl, index) => ({
          imageUrl,
          displayOrder: index,
          isPrimary: index === 0,
          altText: `Imagen ${index + 1} de ${propertyData.title}`,
        })),
      },
      // Crear las relaciones con amenities si se proporcionan (nota: usar propertyamenity en minúscula)
      propertyamenity: propertyData.amenities
        ? {
            create: propertyData.amenities.map((amenityId) => ({
              amenityId: amenityId,
            })),
          }
        : undefined,
    };

    // Solo agregar latitude y longitude si tienen valores válidos
    if (propertyData.latitude !== undefined && propertyData.latitude !== null) {
      propertyCreateData.latitude = propertyData.latitude;
    }
    if (propertyData.longitude !== undefined && propertyData.longitude !== null) {
      propertyCreateData.longitude = propertyData.longitude;
    }

    const property = await prisma.property.create({
      data: propertyCreateData,
      include: {
        // @ts-ignore - Prisma schema usa lowercase
        propertyimage: {
          orderBy: { displayOrder: "asc" },
        },
        // @ts-ignore - Prisma schema usa lowercase
        propertyamenity: {
          include: {
            amenity: true,
          },
        },
      },
    });

    console.log("✅ Propiedad creada exitosamente:", property.id);
    
    // Mapear propertyimage y propertyamenity a los nombres esperados
    const transformedProperty = {
      ...property,
      // @ts-ignore
      propertyImages: property.propertyimage || [],
      // @ts-ignore
      propertyAmenities: property.propertyamenity || [],
    };
    
    return transformedProperty;
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
        // @ts-ignore - Prisma schema usa lowercase
        propertyimage: {
          orderBy: { displayOrder: "asc" },
        },
        // @ts-ignore - Prisma schema usa lowercase
        propertyamenity: {
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
      // @ts-ignore
      images: property.propertyimage?.map((img: any) => img.imageUrl) || [],
      // @ts-ignore
      amenities: property.propertyamenity?.map((pa: any) => pa.amenity) || [],
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
        // @ts-ignore - Prisma schema usa lowercase
        propertyimage: {
          orderBy: { displayOrder: "asc" },
        },
        // @ts-ignore - Prisma schema usa lowercase
        propertyamenity: {
          include: {
            amenity: true,
          },
        },
        comuna: true, // Incluir información de la comuna
        region: true, // Incluir información de la región
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
      // @ts-ignore
      images: property.propertyimage?.map((img: any) => img.imageUrl) || [],
      // @ts-ignore
      amenities: property.propertyamenity?.map((pa: any) => pa.amenity) || [],
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
          // @ts-ignore - Prisma schema usa lowercase
          propertyimage: {
            orderBy: { displayOrder: "asc" },
          },
          // @ts-ignore - Prisma schema usa lowercase
          propertyamenity: {
            include: {
              amenity: true,
            },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    // Parsear campos de forma segura
    const parsedProperties = properties.map((property: any) => {
      return {
        ...property,
        images: property.propertyimage?.map((img: any) => img.imageUrl) || [],
        amenities: property.propertyamenity?.map((pa: any) => pa.amenity) || [],
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
export const getPropertiesWithLandlordInfo = async (
  filters: PropertyFilters
) => {
  try {
    console.log("🏠 Obteniendo propiedades con información de landlords...");

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
          // @ts-ignore - Prisma schema usa lowercase
          propertyimage: {
            orderBy: { displayOrder: 'asc' }, // Ordenar por displayOrder
            take: 1, // Solo traer la primera imagen
          },
          // @ts-ignore - Prisma schema usa lowercase
          propertyamenity: {
            include: {
              amenity: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  icon: true,
                },
              },
            },
          },
          comuna: true, // Incluir información de la comuna
          region: true, // Incluir información de la región
        },
      }),
      prisma.property.count({ where }),
    ]);

    // Obtener IDs únicos de landlords
    const landlordIds = [...new Set(properties.map((p) => p.landlordId))];
    console.log(
      `🔍 Encontrados ${landlordIds.length} landlords únicos para ${properties.length} propiedades`
    );

    // Obtener información de landlords en una sola llamada batch
    const landlordsInfo = await fetchLandlordsInfo(landlordIds);

    // Crear mapa de landlords para acceso rápido
    const landlordsMap = new Map(
      landlordsInfo.map((landlord) => [landlord.id, landlord])
    );

    // Combinar datos de propiedades con información de landlords
    const propertiesWithLandlord = properties.map((property: any) => {
      const landlordInfo = landlordsMap.get(property.landlordId);

      return {
        ...property,
        images: property.propertyimage?.map((img: any) => img.imageUrl) || [],
        amenities: property.propertyamenity?.map((pa: any) => pa.amenity) || [],
        landlord: landlordInfo || {
          id: property.landlordId,
          landlordName: "Landlord no encontrado",
        },
      };
    });

    console.log(
      `✅ Obtenidas ${propertiesWithLandlord.length} propiedades con información de landlords`
    );

    return {
      properties: propertiesWithLandlord,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
      imagesToDelete,
      replaceImages,
      amenities,
      landlordId,
      landlordName,
      ...data
    } = updateData;

    // Preparar datos para actualización (sin landlordId ni landlordName)
    // El landlord no se puede cambiar en una actualización
    const updatePayload: any = { 
      ...data,
      updatedAt: new Date() // Campo requerido por Prisma
    };

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
          await tx.propertyimage.deleteMany({
            where: { propertyId: id },
          });
        }

        // Agregar las nuevas imágenes
        await tx.propertyimage.createMany({
          data: images.map((imageUrl, index) => ({
            propertyId: id,
            imageUrl,
            displayOrder: index,
            isPrimary: index === 0,
            altText: `Imagen ${index + 1} de ${updatedProperty.title}`,
            updatedAt: new Date(), // Campo requerido
          })),
        });
      }

      // Eliminar imágenes específicas si se proporcionan
      if (imagesToDelete && imagesToDelete.length > 0) {
        console.log(`🗑️ Eliminando ${imagesToDelete.length} imágenes específicas...`);
        
        await tx.propertyimage.deleteMany({
          where: {
            propertyId: id,
            imageUrl: {
              in: imagesToDelete,
            },
          },
        });
        
        console.log(`✅ Imágenes eliminadas correctamente`);
      }

      // Manejar amenities si se proporcionan
      if (amenities && amenities.length > 0) {
        // Eliminar todas las relaciones existentes de amenities
        await tx.propertyamenity.deleteMany({
          where: { propertyId: id },
        });

        // Crear las nuevas relaciones con amenities
        await tx.propertyamenity.createMany({
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
          // @ts-ignore - Prisma schema usa lowercase
          propertyimage: {
            orderBy: { displayOrder: "asc" },
          },
          // @ts-ignore - Prisma schema usa lowercase
          propertyamenity: {
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
      // @ts-ignore
      imageCount: result.propertyimage?.length || 0,
      // @ts-ignore
      amenityCount: result.propertyamenity?.length || 0,
    });

    const finalResult: any = {
      ...result,
      // @ts-ignore
      images: result.propertyimage?.map((img: any) => img.imageUrl) || [],
      // @ts-ignore
      amenities: result.propertyamenity?.map((pa: any) => pa.amenity) || [],
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
        // @ts-ignore - Prisma schema usa lowercase
        propertyimage: true,
        // @ts-ignore - Prisma schema usa lowercase
        propertyamenity: {
          include: {
            amenity: true,
          },
        },
        comuna: true, // Incluir información de la comuna
        region: true, // Incluir información de la región
      },
      orderBy: {
        createdAt: "desc", // Ordenar por más recientes primero
      },
    });

    // Transformar los datos para que sean consistentes con el formato esperado
    const transformedProperties = properties.map((property: any) => ({
      ...property,
      propertyImages: property.propertyimage || [],
      propertyAmenities: property.propertyamenity || [],
      amenities: property.propertyamenity?.map((pa: any) => pa.amenity) || [],
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
