import multer from "multer";

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();

// Filtro para validar tipos de archivo
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Permitir solo imágenes
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"));
  }
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
});

// Middleware específico para subida de propiedades
export const uploadPropertyFiles = upload.fields([
  { name: "propertyImages", maxCount: 10 }, // Hasta 10 imágenes de la propiedad
  { name: "utilityBill", maxCount: 1 }, // Una cuenta de servicios
]);
