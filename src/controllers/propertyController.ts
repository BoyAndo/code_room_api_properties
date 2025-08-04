import { Request, Response } from "express";
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFiltersSchema,
} from "../schemas/property.schema";
import {
  createProperty,
  getPropertyById,
  getProperties,
  updateProperty,
  deleteProperty,
} from "../services/property/property.service";
import { extractUtilityBillInfo } from "../services/property/extractUtilityBillInfo";
import {
  uploadImageToBucket,
  uploadPropertyImageToBucket,
} from "../services/shared/s3Service";

/**
 * Crear una nueva propiedad
 */
export const createPropertyController = async (req: Request, res: Response) => {
  try {
    // Validar datos del formulario
    const propertyData = createPropertySchema.parse(req.body);

    console.log("📝 Datos de la propiedad:", propertyData);

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

    // Validar cuenta de servicios contra datos de la propiedad
    console.log("🧾 Validando cuenta de servicios...");
    const utilityBillValidation = await extractUtilityBillInfo(
      utilityBillFile.buffer,
      {
        propertyAddress: propertyData.address,
        propertyComuna: propertyData.comuna,
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
            propertyComuna: propertyData.comuna,
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
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "ID de propiedad inválido",
      });
      return;
    }

    const updateData = updatePropertySchema.parse({ id, ...req.body });
    const updatedProperty = await updateProperty(updateData);

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
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "ID de propiedad inválido",
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
