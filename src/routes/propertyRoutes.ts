import { Router } from "express";
import {
  createPropertyController,
  getPropertyController,
  getPropertyWithLandlordController,
  getPropertiesWithLandlordController,
  getPropertiesByLandlordController,
  updatePropertyController,
  deletePropertyController,
} from "../controllers/propertyController";
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
  requireStudent,
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
  requireStudent,
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
