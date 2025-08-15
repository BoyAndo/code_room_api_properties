import { Router } from "express";
import {
  createPropertyController,
  getPropertyController,
  getPropertiesController,
  updatePropertyController,
  deletePropertyController,
} from "../controllers/propertyController";
import { uploadPropertyFiles } from "../middlewares/multer";
import { verifyToken, requireLandlord } from "../middlewares/auth.middleware";

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
 * @route GET /api/properties
 * @desc Obtener propiedades con filtros opcionales
 * @query comuna, region, propertyType, minRent, maxRent, minBedrooms, maxBedrooms, etc.
 * @access Public
 */
router.get("/", getPropertiesController);

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
router.put("/:id", verifyToken, requireLandlord, updatePropertyController);

/**
 * @route DELETE /api/properties/:id
 * @desc Eliminar una propiedad específica
 * @access Private (solo el landlord propietario)
 */
router.delete("/:id", verifyToken, requireLandlord, deletePropertyController);

export default router;
