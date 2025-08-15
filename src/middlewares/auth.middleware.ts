import fs from "node:fs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

// Interface para el payload del token del landlord
export interface LandlordPayload {
  id: number;
  landlordRut: string;
  landlordEmail: string;
  landlordName: string;
  role: "landlord";
  iat: number;
  exp: number;
}

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: LandlordPayload;
    }
  }
}

const PUBLIC_KEY_PATH = process.env.PUBLIC_KEY_PATH;

if (!PUBLIC_KEY_PATH) {
  throw new Error(
    "La clave pública no está definida en las variables de entorno"
  );
}
const PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");

// Middleware para verificar el token JWT
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No se proporcionó token de autenticación",
    });
  }

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ["RS256"],
    }) as LandlordPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

// Middleware para verificar roles específicos
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(
          ", "
        )}`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Middleware específico para landlords
export const requireLandlord = requireRole(["landlord"]);

// Función helper para extraer información del usuario autenticado
export const getCurrentUser = (req: Request): LandlordPayload => {
  return req.user as LandlordPayload;
};

// Función helper para verificar si el usuario es el propietario de un recurso
export const isResourceOwner = (
  req: Request,
  resourceLandlordId: number
): boolean => {
  const user = getCurrentUser(req);
  return user ? user.id === resourceLandlordId : false;
};
