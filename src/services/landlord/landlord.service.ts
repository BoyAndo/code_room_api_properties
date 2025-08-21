/**
 * Servicio para consultar landlords directamente desde la base de datos consolidada
 */

import { PrismaClient } from "../../generated/prisma";

// Instancia de Prisma para consultas directas a la BD consolidada
const prisma = new PrismaClient();

interface LandlordInfo {
  id: number;
  landlordName: string;
}

interface LandlordBatchResponse {
  success: boolean;
  landlords: LandlordInfo[];
}

/**
 * Obtiene información básica de múltiples landlords directamente de la BD
 */
export const fetchLandlordsInfo = async (
  landlordIds: number[]
): Promise<LandlordInfo[]> => {
  try {
    if (landlordIds.length === 0) {
      return [];
    }

    console.log(
      `🏠 Obteniendo información de ${landlordIds.length} landlords desde BD...`
    );

    // Consulta directa a la tabla de landlords en la BD consolidada
    const landlords = await prisma.landlord.findMany({
      where: {
        id: {
          in: landlordIds,
        },
      },
      select: {
        id: true,
        landlordName: true,
      },
    });

    console.log(
      `✅ Información de ${landlords.length} landlords obtenida exitosamente desde BD`
    );

    return landlords;
  } catch (error) {
    console.error(
      "❌ Error consultando información de landlords en BD:",
      error
    );
    return [];
  }
};

/**
 * Obtiene información de un landlord específico
 */
export const fetchLandlordInfo = async (
  landlordId: number
): Promise<LandlordInfo | null> => {
  try {
    console.log(`🔍 Buscando landlord con ID: ${landlordId}`);

    const landlord = await prisma.landlord.findUnique({
      where: {
        id: landlordId,
      },
      select: {
        id: true,
        landlordName: true,
      },
    });

    if (landlord) {
      console.log(`✅ Landlord encontrado: ${landlord.landlordName}`);
      return landlord;
    } else {
      console.warn(`⚠️ No se encontró landlord con ID: ${landlordId}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Error consultando landlord en BD:", error);
    return null;
  }
};
