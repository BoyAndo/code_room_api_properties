import { Router } from "express";
import {
  createPropertyController,
  getPropertyController,
  getPropertiesController,
  updatePropertyController,
  deletePropertyController,
} from "../controllers/propertyController";
import { uploadPropertyFiles } from "../middlewares/multer";

const router = Router();

/**
 * @route POST /api/properties
 * @desc Crear una nueva propiedad
 * @access Public (por ahora, después se puede agregar autenticación)
 */
router.post("/", uploadPropertyFiles, createPropertyController);

/**
 * @route GET /api/properties
 * @desc Obtener propiedades con filtros opcionales
 * @query city, state, propertyType, minRent, maxRent, minBedrooms, maxBedrooms, etc.
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
 * @access Private (landlord propietario o admin)
 */
router.put("/:id", updatePropertyController);

/**
 * @route DELETE /api/properties/:id
 * @desc Eliminar una propiedad específica
 * @access Private (landlord propietario o admin)
 */
router.delete("/:id", deletePropertyController);

export default router;
