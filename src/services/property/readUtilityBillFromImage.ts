import Tesseract from "tesseract.js";
import sharp from "sharp";
import { normalize } from "../shared/normalize";

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
 * Extrae y valida información de una cuenta de servicios usando OCR
 * @param imageBuffer Buffer de la imagen de la cuenta de servicios
 * @param formData Datos del formulario para comparación
 * @returns Resultado de validación con detalles de coincidencias
 */
export const readUtilityBillFromImage = async (
  imageBuffer: Buffer,
  formData: {
    propertyAddress: string;
    propertyComuna: string;
    landlordName: string;
  }
): Promise<UtilityBillValidationResult> => {
  console.log("🧾 Iniciando OCR de cuenta de servicios para propiedad...");

  try {
    // Preprocesamiento agresivo para cuentas de servicios
    console.log("📸 Iniciando preprocesamiento avanzado...");

    // Paso 1: Redimensionar y mejorar contraste
    const enhancedImage = await sharp(imageBuffer)
      .resize(3000, null, {
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .gamma(1.2) // Ajustar gamma para mejor contraste
      .modulate({
        brightness: 1.1,
        saturation: 0.8,
        hue: 0,
      })
      .png()
      .toBuffer();

    // Paso 2: Crear versión con mayor contraste
    const contrastImage = await sharp(enhancedImage)
      .normalize({
        lower: 1,
        upper: 99,
      })
      .linear(1.3, -(128 * 1.3) + 128) // Aumentar contraste
      .sharpen({
        sigma: 1,
        m1: 1,
        m2: 2,
        x1: 2,
        y2: 10,
      })
      .png()
      .toBuffer();

    // Paso 3: Crear versión binarizada
    const binaryImage = await sharp(contrastImage)
      .greyscale()
      .threshold(140, {
        greyscale: false,
        grayscale: false,
      })
      .png()
      .toBuffer();

    console.log(
      "📸 Preprocesamiento completado - Probando múltiples versiones"
    );

    // Variables para controlar logs únicos
    let enhancedStarted = false;
    let contrastStarted = false;
    let binaryStarted = false;

    // Intentar OCR con múltiples versiones de la imagen
    const ocrResults = await Promise.all([
      // Versión original mejorada
      Tesseract.recognize(enhancedImage, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text" && !enhancedStarted) {
            console.log("🔍 Escaneando versión mejorada...");
            enhancedStarted = true;
          }
        },
      }),

      // Versión con alto contraste
      Tesseract.recognize(contrastImage, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text" && !contrastStarted) {
            console.log("🔍 Escaneando versión con contraste...");
            contrastStarted = true;
          }
        },
      }),

      // Versión binarizada
      Tesseract.recognize(binaryImage, "spa", {
        logger: (m) => {
          if (m.status === "recognizing text" && !binaryStarted) {
            console.log("🔍 Escaneando versión binarizada...");
            binaryStarted = true;
          }
        },
      }),
    ]);

    // Seleccionar el mejor resultado basado en confianza y longitud de texto
    let bestResult = ocrResults[0];
    let bestScore =
      bestResult.data.confidence * (bestResult.data.text.length / 1000);

    console.log("📊 Escaneo completado - Comparando resultados:");
    ocrResults.forEach((result, index) => {
      const versions = ["Enhanced", "Contrast", "Binary"];
      const score = result.data.confidence * (result.data.text.length / 1000);
      console.log(
        `${versions[index]}: Confianza ${result.data.confidence}%, Texto ${
          result.data.text.length
        } chars, Score ${score.toFixed(2)}`
      );

      if (score > bestScore) {
        bestResult = result;
        bestScore = score;
      }
    });

    const extractedText = bestResult.data.text;
    console.log("✅ OCR completado - Mejor resultado seleccionado");
    console.log(
      "📄 Texto extraído (primeros 300 chars):",
      extractedText.substring(0, 300) + "..."
    );

    // Validar información contra datos del formulario
    const validation = validateUtilityBillInfo(extractedText, formData);

    return validation;
  } catch (error) {
    console.error("❌ Error en OCR de cuenta de servicios:", error);
    throw new Error(
      `Error procesando cuenta de servicios: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`
    );
  }
};

/**
 * Valida la información extraída contra los datos del formulario
 */
const validateUtilityBillInfo = (
  extractedText: string,
  formData: {
    propertyAddress: string;
    propertyComuna: string;
    landlordName: string;
  }
): UtilityBillValidationResult => {
  console.log("🔍 Validando información de cuenta de servicios...");

  // Normalizar todo el texto para comparación
  const normalizedExtracted = normalize(extractedText);
  const normalizedName = normalize(formData.landlordName);
  const normalizedAddress = normalize(formData.propertyAddress);
  const normalizedComuna = normalize(formData.propertyComuna);

  console.log("📋 Datos normalizados:", {
    textoExtraido: normalizedExtracted.substring(0, 200) + "...",
    nombreFormulario: normalizedName,
    direccionFormulario: normalizedAddress,
    comunaFormulario: normalizedComuna,
  });

  // Buscar coincidencias del nombre
  const nameFound = findNameInText(normalizedExtracted, normalizedName);

  // Buscar coincidencias de la dirección (incluyendo números)
  const addressFound = findAddressInText(
    normalizedExtracted,
    normalizedAddress
  );

  // Buscar coincidencias de la comuna
  const comunaFound = findComunaInText(normalizedExtracted, normalizedComuna);

  // Calcular confianza basada en las coincidencias (ahora con 3 campos)
  let confidence = 0;
  if (nameFound.found) confidence += 35; // 35% por nombre
  if (addressFound.found) confidence += 40; // 40% por dirección
  if (comunaFound.found) confidence += 25; // 25% por comuna

  // La propiedad es válida si encuentra al menos 2 de los 3 campos
  const foundCount = [
    nameFound.found,
    addressFound.found,
    comunaFound.found,
  ].filter(Boolean).length;
  const isValid = foundCount >= 2;

  console.log("📊 Resultado de validación:", {
    nombreEncontrado: nameFound.found ? "✅ Sí" : "❌ No",
    direccionEncontrada: addressFound.found ? "✅ Sí" : "❌ No",
    comunaEncontrada: comunaFound.found ? "✅ Sí" : "❌ No",
    camposEncontrados: `${foundCount}/3`,
    confianza: `${confidence}%`,
    esValido: isValid ? "✅ Válido" : "❌ No válido",
  });

  return {
    rawText: extractedText,
    isValid,
    confidence,
    matchDetails: {
      nameFound: nameFound.found,
      addressFound: addressFound.found,
      comunaFound: comunaFound.found,
      nameMatch: nameFound.match,
      addressMatch: addressFound.match,
      comunaMatch: comunaFound.match,
    },
  };
};

/**
 * Busca el nombre en el texto extraído de la cuenta
 */
const findNameInText = (
  extractedText: string,
  targetName: string
): { found: boolean; match?: string } => {
  console.log("👤 Buscando nombre en texto extraído...");

  // Normalizar y limpiar el nombre objetivo
  const cleanTargetName = targetName
    .toLowerCase()
    .replace(/[.,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Dividir el nombre en palabras significativas
  const nameWords = cleanTargetName
    .split(/\s+/)
    .filter((word) => word.length > 2); // Solo palabras de más de 2 caracteres

  console.log("👤 Palabras del nombre:", nameWords);

  let foundWords = 0;
  let foundMatches: string[] = [];
  const normalizedExtracted = extractedText.toLowerCase();

  for (const word of nameWords) {
    // Buscar coincidencias exactas
    if (normalizedExtracted.includes(word)) {
      foundWords++;
      foundMatches.push(word);
      console.log(`✅ Nombre encontrado: "${word}"`);
    } else {
      // Buscar coincidencias parciales para typos o abreviaciones
      const partialMatches = findPartialMatches(word, normalizedExtracted);
      if (partialMatches.length > 0) {
        foundWords += 0.8; // Dar peso alto a coincidencias parciales en nombres
        foundMatches.push(`${word}~${partialMatches[0]}`);
        console.log(`🔍 Nombre parcial: "${word}" ≈ "${partialMatches[0]}"`);
      } else {
        console.log(`❌ Nombre no encontrado: "${word}"`);
      }
    }
  }

  // Para nombres, ser más flexible
  const wordsCount = nameWords.length;
  const foundRatio = foundWords / wordsCount;

  // Requierir al menos 70% de coincidencia, pero mínimo 1 palabra
  const requiredThreshold = 0.7;
  const found = foundRatio >= requiredThreshold && foundWords >= 1;

  console.log("📊 Análisis de nombre:", {
    totalPalabras: wordsCount,
    palabrasEncontradas: foundWords,
    ratio: `${(foundRatio * 100).toFixed(1)}%`,
    requerido: `${(requiredThreshold * 100).toFixed(1)}%`,
    resultado: found ? "✅ VÁLIDO" : "❌ NO VÁLIDO",
  });

  return {
    found,
    match: found ? foundMatches.join(" ") : undefined,
  };
};

/**
 * Busca la dirección en el texto extraído de la cuenta (incluyendo números)
 */
const findAddressInText = (
  extractedText: string,
  targetAddress: string
): { found: boolean; match?: string } => {
  console.log("🔍 Buscando dirección en texto extraído...");

  // Normalizar y limpiar la dirección objetivo
  const cleanTargetAddress = targetAddress
    .toLowerCase()
    .replace(/[.,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Dividir en palabras significativas (AHORA INCLUYE NÚMEROS)
  const addressWords = cleanTargetAddress.split(/\s+/).filter((word) => {
    // Incluir números (especialmente direcciones), calles importantes y palabras largas
    return (
      word.length > 1 && // Palabras de más de 1 carácter
      !/^(de|del|la|las|el|los|con|sin|por|para|en|y)$/.test(word) // Excluir solo preposiciones comunes
    );
  });

  console.log(
    "📍 Palabras clave de dirección (incluyendo números):",
    addressWords
  );

  // Buscar coincidencias flexibles
  let foundWords = 0;
  let foundMatches: string[] = [];
  const normalizedExtracted = extractedText.toLowerCase();

  for (const word of addressWords) {
    let wordFound = false;

    // Para números, buscar coincidencias exactas (más estricto)
    if (/^\d+$/.test(word)) {
      if (normalizedExtracted.includes(word)) {
        foundWords += 1.2; // Dar más peso a los números de dirección
        foundMatches.push(word);
        wordFound = true;
        console.log(`✅ Número de dirección encontrado: "${word}"`);
      }
    } else {
      // Para palabras, buscar coincidencias exactas
      if (normalizedExtracted.includes(word)) {
        foundWords++;
        foundMatches.push(word);
        wordFound = true;
        console.log(`✅ Palabra encontrada: "${word}"`);
      } else {
        // Buscar coincidencias parciales (útil para abreviaciones)
        const partialMatches = findPartialMatches(word, normalizedExtracted);
        if (partialMatches.length > 0) {
          foundWords += 0.7; // Dar menos peso a coincidencias parciales
          foundMatches.push(`${word}~${partialMatches[0]}`);
          wordFound = true;
          console.log(
            `🔍 Coincidencia parcial: "${word}" ≈ "${partialMatches[0]}"`
          );
        }
      }
    }

    if (!wordFound) {
      console.log(`❌ No encontrada: "${word}"`);
    }
  }

  // Algoritmo de scoring mejorado
  const wordsCount = addressWords.length;
  const foundRatio = foundWords / wordsCount;

  // Requerimientos variables según la longitud de la dirección
  let requiredThreshold = 0.6; // 60% por defecto

  if (wordsCount <= 2) {
    requiredThreshold = 1.0; // 100% para direcciones muy cortas
  } else if (wordsCount <= 4) {
    requiredThreshold = 0.75; // 75% para direcciones cortas
  } else if (wordsCount >= 6) {
    requiredThreshold = 0.5; // 50% para direcciones largas
  }

  // Requerir al menos 2 palabras encontradas o 1 si incluye número
  const hasNumber = addressWords.some((word) => /^\d+$/.test(word));
  const minWordsRequired = hasNumber ? 1.5 : 2;

  const found =
    foundRatio >= requiredThreshold && foundWords >= minWordsRequired;

  console.log("📊 Análisis de dirección:", {
    totalPalabras: wordsCount,
    palabrasEncontradas: foundWords,
    ratio: `${(foundRatio * 100).toFixed(1)}%`,
    requerido: `${(requiredThreshold * 100).toFixed(1)}%`,
    tieneNumero: hasNumber ? "✅ Sí" : "❌ No",
    resultado: found ? "✅ VÁLIDA" : "❌ NO VÁLIDA",
  });

  return {
    found,
    match: found ? foundMatches.join(" ") : undefined,
  };
};

/**
 * Busca la comuna en el texto extraído de la cuenta
 */
const findComunaInText = (
  extractedText: string,
  targetComuna: string
): { found: boolean; match?: string } => {
  console.log("🏘️ Buscando comuna en texto extraído...");

  // Normalizar y limpiar la comuna objetivo
  const cleanTargetComuna = targetComuna
    .toLowerCase()
    .replace(/[.,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Para comunas, usualmente son 1-3 palabras
  const comunaWords = cleanTargetComuna.split(/\s+/).filter((word) => {
    return word.length > 2; // Solo palabras de más de 2 caracteres
  });

  console.log("🏘️ Palabras de la comuna:", comunaWords);

  let foundWords = 0;
  let foundMatches: string[] = [];
  const normalizedExtracted = extractedText.toLowerCase();

  for (const word of comunaWords) {
    // Buscar coincidencias exactas
    if (normalizedExtracted.includes(word)) {
      foundWords++;
      foundMatches.push(word);
      console.log(`✅ Comuna encontrada: "${word}"`);
    } else {
      // Buscar coincidencias parciales para abreviaciones de comunas
      const partialMatches = findPartialMatches(word, normalizedExtracted);
      if (partialMatches.length > 0) {
        foundWords += 0.8; // Dar buen peso a coincidencias parciales para comunas
        foundMatches.push(`${word}~${partialMatches[0]}`);
        console.log(`🔍 Comuna parcial: "${word}" ≈ "${partialMatches[0]}"`);
      } else {
        console.log(`❌ Comuna no encontrada: "${word}"`);
      }
    }
  }

  // Para comunas, ser más flexible ya que pueden aparecer abreviadas
  const wordsCount = comunaWords.length;
  const foundRatio = foundWords / wordsCount;

  // Umbral más bajo para comunas ya que suelen aparecer abreviadas
  const requiredThreshold = wordsCount === 1 ? 1.0 : 0.6;
  const found = foundRatio >= requiredThreshold && foundWords >= 0.8;

  console.log("📊 Análisis de comuna:", {
    totalPalabras: wordsCount,
    palabrasEncontradas: foundWords,
    ratio: `${(foundRatio * 100).toFixed(1)}%`,
    requerido: `${(requiredThreshold * 100).toFixed(1)}%`,
    resultado: found ? "✅ VÁLIDA" : "❌ NO VÁLIDA",
  });

  return {
    found,
    match: found ? foundMatches.join(" ") : undefined,
  };
};

/**
 * Busca coincidencias parciales para manejar abreviaciones
 */
const findPartialMatches = (word: string, text: string): string[] => {
  const matches: string[] = [];
  const words = text.split(/\s+/);

  for (const textWord of words) {
    // Coincidencia si una palabra contiene a la otra (mínimo 4 caracteres)
    if (word.length >= 4 && textWord.length >= 4) {
      if (word.includes(textWord) || textWord.includes(word)) {
        matches.push(textWord);
      }
    }

    // Coincidencia por distancia de Levenshtein para typos
    if (word.length >= 5 && textWord.length >= 5) {
      const distance = levenshteinDistance(word, textWord);
      const maxDistance = Math.floor(
        Math.min(word.length, textWord.length) * 0.3
      );
      if (distance <= maxDistance) {
        matches.push(textWord);
      }
    }
  }

  return matches.slice(0, 3); // Máximo 3 coincidencias
};

/**
 * Calcula la distancia de Levenshtein entre dos strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
};
