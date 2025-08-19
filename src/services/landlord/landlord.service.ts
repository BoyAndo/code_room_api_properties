/**
 * Servicio para integración con la API de Landlords
 */

interface LandlordInfo {
  id: number;
  landlordName: string;
}

interface LandlordBatchResponse {
  success: boolean;
  landlords: LandlordInfo[];
}

/**
 * Obtiene información básica de múltiples landlords
 * Como no tenemos endpoint batch, obtenemos todos y filtramos
 */
export const fetchLandlordsInfo = async (
  landlordIds: number[]
): Promise<LandlordInfo[]> => {
  try {
    if (landlordIds.length === 0) {
      return [];
    }

    console.log(
      `🏠 Obteniendo información de ${landlordIds.length} landlords...`
    );

    // Obtener todos los landlords de la API
    const response = await fetch(`${process.env.LANDLORDS_API_URL}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(
        `⚠️ API de landlords respondió con status ${response.status}`
      );
      return [];
    }

    const responseData = await response.json();
    console.log(
      "🔍 Respuesta completa de landlords API:",
      JSON.stringify(responseData, null, 2)
    );

    // La respuesta puede tener los datos en "data" o directamente en "landlords"
    let allLandlords: LandlordInfo[] = [];

    if (responseData.success && responseData.landlords) {
      allLandlords = responseData.landlords;
    } else if (responseData.data && responseData.data.landlords) {
      allLandlords = responseData.data.landlords;
    } else if (Array.isArray(responseData.landlords)) {
      allLandlords = responseData.landlords;
    } else if (Array.isArray(responseData)) {
      allLandlords = responseData;
    } else {
      console.warn(
        "⚠️ Formato de respuesta de landlords API no reconocido:",
        responseData
      );
      return [];
    }

    // Filtrar solo los landlords que necesitamos
    const filteredLandlords = allLandlords.filter((landlord) =>
      landlordIds.includes(landlord.id)
    );

    console.log(
      `✅ Información de ${filteredLandlords.length} landlords obtenida exitosamente`
    );
    return filteredLandlords;
  } catch (error) {
    console.error("❌ Error fetcheando información de landlords:", error);
    return [];
  }
};

/**
 * Obtiene información de un landlord específico
 */
export const fetchLandlordInfo = async (
  landlordId: number
): Promise<LandlordInfo | null> => {
  const landlords = await fetchLandlordsInfo([landlordId]);
  return landlords.length > 0 ? landlords[0] : null;
};
