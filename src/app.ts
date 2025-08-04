import dotenv from "dotenv";
dotenv.config({ quiet: true });
import express from "express";
import cookieParser from "cookie-parser";
import propertyRoutes from "./routes/propertyRoutes";

const app = express();

// Middlewares globales
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// CORS básico (ajustar según necesidades)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
});

// Rutas principales
app.use("/api/properties", propertyRoutes);

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
