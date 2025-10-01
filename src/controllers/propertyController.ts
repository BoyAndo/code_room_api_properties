import { Request, Response } from "express";
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFiltersSchema,
} from "../schemas/property.schema";
import {
  createProperty,
  getPropertyById,
  getPropertyByIdWithLandlord,
  getProperties,
  getPropertiesWithLandlordInfo,
  getPropertiesByLandlordId,
  updateProperty,
  deleteProperty,
} from "../services/property/property.service";
import { extractUtilityBillInfo } from "../services/property/extractUtilityBillInfo";
import {
  uploadImageToBucket,
  uploadPropertyImageToBucket,
} from "../services/shared/s3Service";
import {
  getCurrentUser,
  isResourceOwner,
  LandlordPayload,
  isLandlord,
} from "../middlewares/auth.middleware";

/**
 * Crear una nueva propiedad
 */
export const createPropertyController = async (req: Request, res: Response) => {
  try {
    // Obtener información del usuario autenticado
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    // Validar datos del formulario
    const propertyData = createPropertySchema.parse(req.body);

    // Verificar que el landlordId coincida con el usuario autenticado
    if (propertyData.landlordId !== currentUser.id) {
      res.status(403).json({
        success: false,
        message: "No puedes crear propiedades para otro landlord",
        authenticatedUser: currentUser.id,
        requestedLandlordId: propertyData.landlordId,
      });
      return;
    }

    // Verificar que el usuario sea un landlord
    if (!isLandlord(currentUser)) {
      res.status(403).json({
        success: false,
        message: "Solo los landlords pueden crear propiedades",
        userRole: currentUser.role,
      });
      return;
    }

    // Asegurar que el nombre del landlord coincida con el token
    if (
      propertyData.landlordName.toLowerCase() !==
      currentUser.landlordName.toLowerCase()
    ) {
      res.status(400).json({
        success: false,
        message:
          "El nombre del landlord debe coincidir con el usuario autenticado",
        expectedName: currentUser.landlordName,
        providedName: propertyData.landlordName,
      });
      return;
    }

    console.log("📝 Datos de la propiedad:", propertyData);
    console.log("👤 Usuario autenticado:", {
      id: currentUser.id,
      name: currentUser.landlordName,
      email: currentUser.landlordEmail,
    });

    // Verificar archivos subidos
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files.utilityBill) {
      res.status(400).json({
        success: false,
        message: "Se requiere la cuenta de servicios de la propiedad",
      });
      return;
    }

    const utilityBillFile = files.utilityBill[0];
    const propertyImageFiles = files.propertyImages || [];

    console.log("📎 Archivos recibidos:", {
      cuentaServicios: utilityBillFile?.originalname,
      imagenes: propertyImageFiles.map((f) => f.originalname),
    });

    // Validar cuenta de servicios usando nombres directamente del formulario
    console.log("🧾 Validando cuenta de servicios...");
    const utilityBillValidation = await extractUtilityBillInfo(
      utilityBillFile.buffer,
      {
        propertyAddress: propertyData.address,
        propertyComuna: propertyData.comunaName, // ← Directamente del form, sin consultas
        landlordName: propertyData.landlordName,
      }
    );

    console.log("🔍 Resultado de validación:", utilityBillValidation);

    // Verificar si la validación fue exitosa
    if (!utilityBillValidation.isValid) {
      let errorMessage = "Los datos de la cuenta de servicios no coinciden:";
      const missingFields = [];

      if (!utilityBillValidation.matchDetails.nameFound) {
        missingFields.push("nombre del landlord");
      }
      if (!utilityBillValidation.matchDetails.addressFound) {
        missingFields.push("dirección de la propiedad");
      }
      if (!utilityBillValidation.matchDetails.comunaFound) {
        missingFields.push("comuna");
      }

      if (missingFields.length > 0) {
        errorMessage += ` No se encontró: ${missingFields.join(", ")}.`;
      }

      res.status(400).json({
        success: false,
        message: errorMessage,
        details: {
          form: {
            landlordName: propertyData.landlordName,
            propertyAddress: propertyData.address,
            propertyComuna: propertyData.comunaName, // ← Directo del form
            regionName: propertyData.regionName, // ← Directo del form
            regionId: propertyData.regionId,
            comunaId: propertyData.comunaId,
          },
          matchDetails: utilityBillValidation.matchDetails,
          confidence: utilityBillValidation.confidence,
          rawTextSample:
            utilityBillValidation.rawText.substring(0, 200) + "...",
          suggestion:
            "Asegúrate de que la cuenta de servicios contenga el nombre del propietario, la dirección completa con números, y la comuna de la propiedad.",
        },
      });
      return;
    }

    // Verificar confianza mínima
    if (utilityBillValidation.confidence < 40) {
      res.status(400).json({
        success: false,
        message: `La calidad de la imagen de la cuenta de servicios es insuficiente. Confianza: ${utilityBillValidation.confidence}%. Por favor, envía una imagen más clara.`,
        details: {
          confidence: utilityBillValidation.confidence,
          suggestions: [
            "Asegúrate de que la imagen esté bien iluminada",
            "El texto debe estar nítido y legible",
            "Evita sombras o reflejos en el documento",
            "Toma la foto desde arriba, perpendicular al documento",
          ],
        },
      });
      return;
    }

    console.log("✅ Validación de cuenta de servicios exitosa");

    // Subir archivos al storage
    console.log("📤 Subiendo archivos...");

    // Subir cuenta de servicios
    const utilityBillUrl = await uploadImageToBucket(
      utilityBillFile.buffer,
      utilityBillFile.originalname || "utility-bill.jpg"
    );

    // Subir imágenes de la propiedad
    const imageUrls: string[] = [];
    for (const imageFile of propertyImageFiles) {
      const imageUrl = await uploadPropertyImageToBucket(
        imageFile.buffer,
        imageFile.originalname || "property-image.jpg"
      );
      imageUrls.push(imageUrl);
    }

    console.log("📤 Archivos subidos:", {
      cuentaServicios: utilityBillUrl,
      imagenes: imageUrls,
    });

    // Crear propiedad en la base de datos
    const newProperty = await createProperty(
      propertyData,
      imageUrls,
      utilityBillUrl,
      true // Marcar como validada ya que pasó la validación
    );

    res.status(201).json({
      success: true,
      message: "Propiedad creada exitosamente",
      data: newProperty,
      validation: {
        utilityBillValidated: true,
        confidence: utilityBillValidation.confidence,
        matchDetails: utilityBillValidation.matchDetails,
      },
    });
  } catch (error) {
    console.error("❌ Error creando propiedad:", error);

    // Manejo de errores de validación de Zod
    if (error && typeof error === "object" && "issues" in error) {
      res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: (error as any).issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener una propiedad por ID
 */
export const getPropertyController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "ID de propiedad inválido",
      });
      return;
    }

    const property = await getPropertyById(id);

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error("❌ Error obteniendo propiedad:", error);

    if (error instanceof Error && error.message === "Propiedad no encontrada") {
      res.status(404).json({
        success: false,
        message: "Propiedad no encontrada",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener propiedades con filtros
 */
export const getPropertiesController = async (req: Request, res: Response) => {
  try {
    // Convertir query params a tipos apropiados
    const queryParams: any = { ...req.query };

    // Convertir strings a números donde sea necesario
    const numericFields = [
      "minRent",
      "maxRent",
      "minBedrooms",
      "maxBedrooms",
      "minBathrooms",
      "maxBathrooms",
      "landlordId",
      "page",
      "limit",
    ];
    numericFields.forEach((field) => {
      if (queryParams[field]) {
        queryParams[field] = Number(queryParams[field]);
      }
    });

    // Convertir string a booleano para isAvailable
    if (queryParams.isAvailable !== undefined) {
      queryParams.isAvailable = queryParams.isAvailable === "true";
    }

    const filters = propertyFiltersSchema.parse(queryParams);
    const result = await getProperties(filters);

    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("❌ Error obteniendo propiedades:", error);

    // Manejo de errores de validación de Zod
    if (error && typeof error === "object" && "issues" in error) {
      res.status(400).json({
        success: false,
        message: "Parámetros de filtro inválidos",
        errors: (error as any).issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Actualizar una propiedad
 */
export const updatePropertyController = async (req: Request, res: Response) => {
  try {
    // Obtener información del usuario autenticado
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "ID de propiedad inválido",
      });
      return;
    }

    // Verificar que la propiedad existe y que el usuario es el propietario
    const existingProperty = await getPropertyById(id);
    if (!existingProperty) {
      res.status(404).json({
        success: false,
        message: "Propiedad no encontrada",
      });
      return;
    }

    if (!isResourceOwner(req, existingProperty.landlordId)) {
      res.status(403).json({
        success: false,
        message: "No tienes permisos para actualizar esta propiedad",
        propertyOwner: existingProperty.landlordId,
        authenticatedUser: currentUser.id,
      });
      return;
    }

    console.log("📥 Datos del body recibidos:", req.body);
    console.log("🆔 ID de la propiedad:", id);

    // Verificar si se subieron nuevas imágenes
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const propertyImageFiles = files?.propertyImages || [];

    console.log(
      "📸 Nuevas imágenes recibidas:",
      propertyImageFiles.map((f) => f.originalname)
    );

    // Si se subieron nuevas imágenes, subirlas a S3/MinIO
    let newImageUrls: string[] = [];
    if (propertyImageFiles.length > 0) {
      console.log("📤 Subiendo nuevas imágenes...");

      for (const imageFile of propertyImageFiles) {
        try {
          const imageUrl = await uploadPropertyImageToBucket(
            imageFile.buffer,
            imageFile.originalname
          );
          newImageUrls.push(imageUrl);
          console.log("✅ Imagen subida:", imageUrl);
        } catch (error) {
          console.error("❌ Error subiendo imagen:", error);
          res.status(500).json({
            success: false,
            message: "Error subiendo imagen",
            error: error instanceof Error ? error.message : "Error desconocido",
          });
          return;
        }
      }
    }

    console.log("📋 Datos combinados para validación:", { id, ...req.body });

    const updateData = updatePropertySchema.parse({ id, ...req.body });
    console.log("✅ Datos validados correctamente:", updateData);

    // Si se subieron nuevas imágenes, actualizar el campo images
    let finalUpdateData = updateData;
    if (newImageUrls.length > 0) {
      // Verificar si se deben reemplazar las imágenes o agregar a las existentes
      const shouldReplace = updateData.replaceImages || false;

      if (shouldReplace) {
        // Reemplazar todas las imágenes con las nuevas
        finalUpdateData = {
          ...updateData,
          images: newImageUrls,
        };
        console.log("� Reemplazando todas las imágenes con:", newImageUrls);
      } else {
        // Obtener imágenes existentes (ya parseadas por getPropertyById)
        const existingImages = existingProperty.images || [];
        console.log("📷 Imágenes existentes:", existingImages);

        const allImages = [...existingImages, ...newImageUrls];
        finalUpdateData = {
          ...updateData,
          images: allImages,
        };
        console.log("📸 Agregando nuevas imágenes. Total:", allImages);
      }
    }

    const updatedProperty = await updateProperty(finalUpdateData);

    console.log("🎉 Respuesta final del controlador:", {
      id: updatedProperty.id,
      title: updatedProperty.title,
      monthlyRent: updatedProperty.monthlyRent,
      isAvailable: updatedProperty.isAvailable,
      imagesCount: Array.isArray(updatedProperty.images)
        ? updatedProperty.images.length
        : 0,
    });

    res.json({
      success: true,
      message: "Propiedad actualizada exitosamente",
      data: updatedProperty,
    });
  } catch (error) {
    console.error("❌ Error actualizando propiedad:", error);

    // Manejo de errores de validación de Zod
    if (error && typeof error === "object" && "issues" in error) {
      res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: (error as any).issues,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Eliminar una propiedad
 */
export const deletePropertyController = async (req: Request, res: Response) => {
  try {
    // Obtener información del usuario autenticado
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
      return;
    }

    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "ID de propiedad inválido",
      });
      return;
    }

    // Verificar que la propiedad existe y que el usuario es el propietario
    const existingProperty = await getPropertyById(id);
    if (!existingProperty) {
      res.status(404).json({
        success: false,
        message: "Propiedad no encontrada",
      });
      return;
    }

    if (!isResourceOwner(req, existingProperty.landlordId)) {
      res.status(403).json({
        success: false,
        message: "No tienes permisos para eliminar esta propiedad",
        propertyOwner: existingProperty.landlordId,
        authenticatedUser: currentUser.id,
      });
      return;
    }

    await deleteProperty(id);

    res.json({
      success: true,
      message: "Propiedad eliminada exitosamente",
    });
  } catch (error) {
    console.error("❌ Error eliminando propiedad:", error);

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener propiedad por ID con información del landlord (OPTIMIZADO)
 */
export const getPropertyWithLandlordController = async (
  req: Request,
  res: Response
) => {
  try {
    const propertyId = parseInt(req.params.id);

    if (isNaN(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "ID de propiedad inválido",
      });
    }

    console.log(
      `🏠 Obteniendo propiedad ${propertyId} con información del landlord...`
    );

    const property = await getPropertyByIdWithLandlord(propertyId);

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error("❌ Error obteniendo propiedad con landlord:", error);

    if (error instanceof Error && error.message === "Propiedad no encontrada") {
      return res.status(404).json({
        success: false,
        message: "Propiedad no encontrada",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener propiedades con información de landlords (OPTIMIZADO)
 */
export const getPropertiesWithLandlordController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("🏠 Obteniendo propiedades con información de landlords...");
    console.log("📋 Query params:", req.query);

    // Validar parámetros de consulta
    const parseResult = propertyFiltersSchema.safeParse(req.query);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: "Parámetros de consulta inválidos",
        errors: parseResult.error.issues,
      });
    }

    const filters = parseResult.data;

    const result = await getPropertiesWithLandlordInfo(filters);

    console.log(
      `✅ Devolviendo ${result.properties.length} propiedades con landlord info`
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error obteniendo propiedades con landlords:", error);

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

/**
 * Obtener todas las propiedades de un landlord específico
 */
export const getPropertiesByLandlordController = async (
  req: Request,
  res: Response
) => {
  try {
    // Obtener información del usuario autenticado
    const currentUser = getCurrentUser(req);
    if (!currentUser || !isLandlord(currentUser)) {
      res.status(401).json({
        success: false,
        message: "Usuario no autenticado o no es landlord",
      });
      return;
    }

    // El landlord solo puede consultar sus propias propiedades
    const landlordId = currentUser.id;

    const properties = await getPropertiesByLandlordId(landlordId);

    res.status(200).json({
      success: true,
      data: properties,
      total: properties.length,
      message: `${properties.length} propiedades encontradas`,
    });
  } catch (error) {
    console.error("❌ Error obteniendo propiedades del landlord:", error);

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};
