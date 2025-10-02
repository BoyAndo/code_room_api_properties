import { PrismaClient } from "../../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutos
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 días

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado en las variables de entorno");
}

// Interfaces para los payloads
interface BaseTokenPayload {
  id: number;
  role: "student" | "landlord";
}

interface StudentTokenPayload extends BaseTokenPayload {
  studentRut: string;
  studentEmail: string;
  studentName: string;
  studentCollege: string;
  role: "student";
}

interface LandlordTokenPayload extends BaseTokenPayload {
  landlordRut: string;
  landlordEmail: string;
  landlordName: string;
  role: "landlord";
}

export type TokenPayload = StudentTokenPayload | LandlordTokenPayload;

/**
 * Genera un access token de corta duración (15 minutos)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET!, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

/**
 * Genera un refresh token de larga duración (7 días) y lo almacena en la BD
 */
export const generateRefreshToken = async (
  userId: number,
  userType: "student" | "landlord"
): Promise<string> => {
  // Generar un token único y seguro
  const tokenId = crypto.randomBytes(40).toString("hex");

  const payload = {
    userId,
    userType,
    tokenId,
  };

  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET!, {
    algorithm: "HS256",
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  // Calcular fecha de expiración (7 días)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Almacenar en base de datos
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      studentId: userType === "student" ? userId : null,
      landlordId: userType === "landlord" ? userId : null,
      userType,
      expiresAt,
      isRevoked: false,
    },
  });

  return refreshToken;
};

/**
 * Verifica si un refresh token es válido
 */
export const verifyRefreshToken = async (
  token: string
): Promise<{ valid: boolean; payload?: any; error?: string }> => {
  try {
    // Verificar firma del token
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET!, {
      algorithms: ["HS256"],
    }) as any;

    // Verificar en la base de datos
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      return { valid: false, error: "Token no encontrado en base de datos" };
    }

    if (storedToken.isRevoked) {
      return { valid: false, error: "Token ha sido revocado" };
    }

    if (new Date() > storedToken.expiresAt) {
      return { valid: false, error: "Token expirado" };
    }

    return { valid: true, payload: decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: "Token expirado" };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: "Token inválido" };
    }
    return { valid: false, error: "Error al verificar token" };
  }
};

/**
 * Invalida un refresh token específico (usado en logout)
 */
export const revokeRefreshToken = async (token: string): Promise<boolean> => {
  try {
    const result = await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error revocando refresh token:", error);
    return false;
  }
};

/**
 * Invalida todos los refresh tokens de un usuario (usado en logout global o cambio de contraseña)
 */
export const revokeAllUserTokens = async (
  userId: number,
  userType: "student" | "landlord"
): Promise<number> => {
  try {
    const whereClause =
      userType === "student" ? { studentId: userId } : { landlordId: userId };

    const result = await prisma.refreshToken.updateMany({
      where: whereClause,
      data: { isRevoked: true },
    });

    return result.count;
  } catch (error) {
    console.error("Error revocando todos los tokens del usuario:", error);
    return 0;
  }
};

/**
 * Limpia tokens expirados de la base de datos (tarea de mantenimiento)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("Error limpiando tokens expirados:", error);
    return 0;
  }
};

/**
 * Rotación de refresh token: revoca el token anterior y genera uno nuevo
 */
export const rotateRefreshToken = async (
  oldToken: string,
  userId: number,
  userType: "student" | "landlord"
): Promise<string | null> => {
  try {
    // Revocar el token anterior
    await revokeRefreshToken(oldToken);

    // Generar un nuevo refresh token
    const newRefreshToken = await generateRefreshToken(userId, userType);

    return newRefreshToken;
  } catch (error) {
    console.error("Error en rotación de refresh token:", error);
    return null;
  }
};
