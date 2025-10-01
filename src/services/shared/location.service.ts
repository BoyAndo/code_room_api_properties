import axios from "axios";

const API_REGISTER_URL =
  process.env.API_REGISTER_URL || "http://localhost:3001";

export interface Region {
  id: number;
  code: string;
  name: string;
}

export interface Comuna {
  id: number;
  name: string;
  regionId: number;
}

export class LocationService {
  /**
   * Obtiene información de una región por su ID
   */
  static async getRegionById(regionId: number): Promise<Region | null> {
    try {
      const response = await axios.get(`${API_REGISTER_URL}/api/regions`);
      const regions: Region[] = response.data;

      return regions.find((region) => region.id === regionId) || null;
    } catch (error) {
      console.error("Error al obtener región por ID:", error);
      return null;
    }
  }

  /**
   * Obtiene información de una comuna por su ID
   */
  static async getComunaById(comunaId: number): Promise<Comuna | null> {
    try {
      // Necesitamos obtener todas las regiones y buscar en sus comunas
      const response = await axios.get(`${API_REGISTER_URL}/api/regions`);
      const regions: Region[] = response.data;

      for (const region of regions) {
        try {
          const comunasResponse = await axios.get(
            `${API_REGISTER_URL}/api/regions/${region.id}/comunas`
          );
          const comunas: Comuna[] = comunasResponse.data;

          const comuna = comunas.find((c) => c.id === comunaId);
          if (comuna) {
            return comuna;
          }
        } catch (error) {
          console.error(
            `Error al obtener comunas de región ${region.id}:`,
            error
          );
        }
      }

      return null;
    } catch (error) {
      console.error("Error al obtener comuna por ID:", error);
      return null;
    }
  }

  /**
   * Obtiene los nombres de región y comuna por sus IDs
   * Útil para comparar con los datos extraídos por Tesseract
   */
  static async getLocationNames(
    regionId: number,
    comunaId: number
  ): Promise<{
    regionName: string | null;
    comunaName: string | null;
  }> {
    try {
      const [region, comuna] = await Promise.all([
        this.getRegionById(regionId),
        this.getComunaById(comunaId),
      ]);

      return {
        regionName: region?.name || null,
        comunaName: comuna?.name || null,
      };
    } catch (error) {
      console.error("Error al obtener nombres de ubicación:", error);
      return {
        regionName: null,
        comunaName: null,
      };
    }
  }

  /**
   * Normaliza un nombre para comparación (elimina acentos, espacios extra, etc.)
   */
  static normalizeForComparison(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
      .replace(/\s+/g, " ") // Normaliza espacios
      .trim();
  }

  /**
   * Compara si dos nombres de ubicación son similares
   */
  static areLocationsSimilar(
    name1: string,
    name2: string,
    threshold: number = 0.8
  ): boolean {
    const normalized1 = this.normalizeForComparison(name1);
    const normalized2 = this.normalizeForComparison(name2);

    // Comparación exacta después de normalización
    if (normalized1 === normalized2) {
      return true;
    }

    // Verificar si uno contiene al otro
    if (
      normalized1.includes(normalized2) ||
      normalized2.includes(normalized1)
    ) {
      return true;
    }

    // Cálculo de similaridad usando distancia de Levenshtein simplificada
    const similarity = this.calculateSimilarity(normalized1, normalized2);
    return similarity >= threshold;
  }

  /**
   * Calcula la similaridad entre dos strings usando una versión simplificada
   * de la distancia de Levenshtein
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }
}
