import { readUtilityBillFromImage } from "./readUtilityBillFromImage";

interface UtilityBillValidationResult {
  rawText: string;
  isValid: boolean;
  confidence: number;
  matchDetails: {
    nameFound: boolean;
    addressFound: boolean;
    comunaFound: boolean;
    nameMatch?: string;
    addressMatch?: string;
    comunaMatch?: string;
  };
}

/**
 * Extrae información de la cuenta de servicios de la propiedad usando comparación directa de texto
 * @param imageBuffer Buffer de la imagen de la cuenta de servicios
 * @param formData Datos del formulario de la propiedad para validación directa
 * @returns Objeto con el resultado de validación simplificado
 */
export const extractUtilityBillInfo = async (
  imageBuffer: Buffer,
  formData: {
    propertyAddress: string;
    propertyComuna: string;
    landlordName: string;
  }
): Promise<UtilityBillValidationResult> => {
  console.log("🧾 Iniciando validación de cuenta de servicios de propiedad...");

  try {
    // Usar el método simplificado que compara directamente el texto
    console.log(
      "🔍 Validando cuenta de servicios contra datos de la propiedad..."
    );
    const result = await readUtilityBillFromImage(imageBuffer, formData);

    console.log("📊 Resultado de validación de cuenta:", {
      textoExtraido: result.rawText.length > 0 ? "✅ Sí" : "❌ No",
      nombreEncontrado: result.matchDetails.nameFound ? "✅ Sí" : "❌ No",
      direccionEncontrada: result.matchDetails.addressFound ? "✅ Sí" : "❌ No",
      comunaEncontrada: result.matchDetails.comunaFound ? "✅ Sí" : "❌ No",
      esValido: result.isValid ? "✅ Sí" : "❌ No",
      confianza: `${result.confidence}%`,
    });

    return result;
  } catch (error) {
    console.error(
      "❌ Error extrayendo información de cuenta de servicios:",
      error
    );
    throw new Error(
      `Error procesando cuenta de servicios: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};
