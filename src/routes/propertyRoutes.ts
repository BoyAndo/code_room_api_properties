import { Router } from "express";
import { PrismaClient } from "../generated/prisma";
import {
  createPropertyController,
  getPropertyController,
  getPropertyWithLandlordController,
  getPropertiesWithLandlordController,
  getPropertiesByLandlordController,
  updatePropertyController,
  deletePropertyController,
} from "../controllers/propertyController";
import { isLandlord, isStudent } from "../middlewares/auth.middleware";

const prisma = new PrismaClient();
import { getAmenitiesController } from "../controllers/amenity.controller";
import { uploadPropertyFiles } from "../middlewares/multer";
import {
  verifyToken,
  requireLandlord,
  requireStudent,
} from "../middlewares/auth.middleware";

const router = Router();

/**
 * @route POST /api/properties
 * @desc Crear una nueva propiedad
 * @access Private (solo landlords autenticados)
 */
router.post(
  "/",
  verifyToken,
  requireLandlord,
  uploadPropertyFiles,
  createPropertyController
);

/**
 * @route GET /api/properties/amenities
 * @desc Obtener todos los amenities disponibles
 * @access Public
 */
router.get("/amenities", getAmenitiesController);

/**
 * @route GET /api/properties/my-properties
 * @desc Obtener todas las propiedades del landlord autenticado
 * @access Private (solo landlords autenticados)
 */
router.get(
  "/my-properties",
  verifyToken,
  requireLandlord,
  getPropertiesByLandlordController
);

/**
 * @route GET /api/properties/with-landlord
 * @desc Obtener propiedades con información del landlord (OPTIMIZADO)
 * @query comuna, region, propertyType, minRent, maxRent, minBedrooms, maxBedrooms, etc.
 * @access Public
 */
router.get(
  "/with-landlord",
  verifyToken,
  async (req, res, next) => {
    try {
      // Si es landlord, solo puede ver sus propias propiedades
      if (req.user && isLandlord(req.user)) {
        // Modificar los filtros para mostrar solo sus propiedades
        req.query.landlordId = req.user.id.toString();
      } 
      // Si es estudiante, puede ver todas las propiedades
      else if (req.user && isStudent(req.user)) {
        // No modificar los filtros, puede ver todo
      } else {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado"
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  },
  getPropertiesWithLandlordController
);

/**
 * @route GET /api/properties/:id/with-landlord
 * @desc Obtener propiedad específica con información del landlord (OPTIMIZADO)
 * @access Public
 */
router.get(
  "/:id/with-landlord",
  verifyToken,
  async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado"
        });
      }

      const propertyId = parseInt(req.params.id);
      // Obtener la propiedad primero para verificar el propietario
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Propiedad no encontrada"
        });
      }

      // Si es landlord, solo puede ver sus propias propiedades
      if (isLandlord(req.user)) {
        if (property.landlordId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "No tienes permiso para ver esta propiedad"
          });
        }
      } 
      // Si es estudiante, puede ver cualquier propiedad
      else if (!isStudent(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado"
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  },
  getPropertyWithLandlordController
);

/**
 * @route GET /api/properties/:id
 * @desc Obtener una propiedad específica por ID
 * @access Public
 */
router.get("/:id", getPropertyController);

/**
 * @route PUT /api/properties/:id
 * @desc Actualizar una propiedad específica
 * @access Private (solo el landlord propietario)
 */
router.put(
  "/:id",
  verifyToken,
  requireLandlord,
  uploadPropertyFiles,
  updatePropertyController
);

/**
 * @route DELETE /api/properties/:id
 * @desc Eliminar una propiedad específica
 * @access Private (solo el landlord propietario)
 */
router.delete("/:id", verifyToken, requireLandlord, deletePropertyController);

export default router;
