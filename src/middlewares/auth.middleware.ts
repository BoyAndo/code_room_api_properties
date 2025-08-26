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

// Interface para el payload del token del student
export interface StudentPayload {
  id: number;
  studentRut: string;
  studentEmail: string;
  studentName: string;
  role: "student";
  iat: number;
  exp: number;
}

// Union type para ambos tipos de payload
export type UserPayload = LandlordPayload | StudentPayload;

// Type guards para verificar el tipo de usuario
export const isLandlord = (user: UserPayload): user is LandlordPayload => {
  return user.role === "landlord";
};

export const isStudent = (user: UserPayload): user is StudentPayload => {
  return user.role === "student";
};

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// Verificar que el JWT_SECRET esté configurado
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está definido en las variables de entorno");
}

// Middleware para verificar el token JWT usando HMAC
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
    // Verificar token con HMAC (HS256)
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"], // Especificar algoritmo explícitamente
    }) as UserPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
        error: "TokenExpiredError",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
        error: "JsonWebTokenError",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Error de validación del token",
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

// Middleware para students
export const requireStudent = requireRole(["student"]);

// Función helper para extraer información del usuario autenticado
export const getCurrentUser = (req: Request): UserPayload => {
  return req.user as UserPayload;
};

// Función helper para verificar si el usuario es el propietario de un recurso
export const isResourceOwner = (
  req: Request,
  resourceLandlordId: number
): boolean => {
  const user = getCurrentUser(req);
  return user && isLandlord(user) ? user.id === resourceLandlordId : false;
};
