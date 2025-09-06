import dotenv from "dotenv";
dotenv.config({ quiet: true });
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import propertyRoutes from "./routes/propertyRoutes";
import {
  verifyToken,
  getCurrentUser,
  isLandlord,
} from "./middlewares/auth.middleware";

const app = express();

// ✅ Configuración CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Frontend Next.js
      "http://127.0.0.1:3000", // Frontend Next.js
    ],
    credentials: true, // Permitir cookies httpOnly
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Origin",
    ], // ✅ Agregar Origin
  })
);

// ✅ Middlewares básicos
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Rutas principales
app.use("/api/properties", propertyRoutes);

// Endpoint de prueba de autenticación
app.get("/api/auth/test", verifyToken, (req, res) => {
  const currentUser = getCurrentUser(req);

  // Usar type guard para acceder a propiedades específicas
  let userInfo;
  if (isLandlord(currentUser)) {
    userInfo = {
      id: currentUser.id,
      name: currentUser.landlordName,
      email: currentUser.landlordEmail,
      role: currentUser.role,
      rut: currentUser.landlordRut,
    };
  } else {
    userInfo = {
      id: currentUser.id,
      name: currentUser.studentName,
      email: currentUser.studentEmail,
      role: currentUser.role,
      rut: currentUser.studentRut,
    };
  }

  res.json({
    success: true,
    message: "Token válido - Usuario autenticado",
    user: userInfo,
  });
});

// Ruta de salud
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API de propiedades Code Room funcionando correctamente",
    timestamp: new Date().toISOString(),
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "🏠 API de Propiedades Code Room",
    version: "1.0.0",
    endpoints: {
      properties: "/api/properties",
      authTest: "/api/auth/test",
      health: "/health",
    },
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

// Manejo global de errores
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("❌ Error global:", error);

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Error interno",
    });
  }
);

console.log("🚀 Servidor inicializando...");

export default app;
