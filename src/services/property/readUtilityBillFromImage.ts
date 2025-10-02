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
  errorMessages?: string[]; // Mensajes de error detallados para cada campo
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

  // MODO ESTRICTO: Requiere los 3 campos obligatorios
  let confidence = 0;
  if (nameFound.found) confidence += 35; // 35% por nombre
  if (addressFound.found) confidence += 40; // 40% por dirección
  if (comunaFound.found) confidence += 25; // 25% por comuna

  // VALIDACIÓN ESTRICTA: Los 3 campos son obligatorios
  const isValid = nameFound.found && addressFound.found && comunaFound.found;

  const foundCount = [
    nameFound.found,
    addressFound.found,
    comunaFound.found,
  ].filter(Boolean).length;

  // Generar mensajes de error detallados para cada campo faltante
  const errorMessages: string[] = [];

  if (!nameFound.found) {
    errorMessages.push(
      "El nombre del propietario no se distingue claramente en la cuenta de servicios. Asegúrate de que el nombre esté visible y legible en el documento."
    );
  }

  if (!addressFound.found) {
    // Determinar qué faltó específicamente en la dirección
    const addressWords = normalizedAddress
      .split(/\s+/)
      .filter((w) => w.length > 1);
    const streetNumbers = addressWords.filter((w) => /^\d+$/.test(w));
    const hasNumbers = streetNumbers.length > 0;

    if (hasNumbers) {
      errorMessages.push(
        "El número de calle no fue encontrado en la cuenta de servicios. Verifica que el número de la dirección sea visible y coincida exactamente con la dirección ingresada."
      );
    } else {
      errorMessages.push(
        "El nombre de la calle no se distingue en la cuenta de servicios. Asegúrate de que la dirección completa esté visible y sea legible en el documento."
      );
    }
  }

  if (!comunaFound.found) {
    errorMessages.push(
      "La comuna no fue encontrada en la cuenta de servicios. Verifica que la comuna esté visible y coincida con la comuna ingresada."
    );
  }

  console.log("📊 Resultado de validación (MODO ESTRICTO):", {
    nombreEncontrado: nameFound.found ? "✅ Sí" : "❌ No",
    direccionEncontrada: addressFound.found ? "✅ Sí" : "❌ No",
    comunaEncontrada: comunaFound.found ? "✅ Sí" : "❌ No",
    camposEncontrados: `${foundCount}/3`,
    confianza: `${confidence}%`,
    esValido: isValid
      ? "✅ Válido (3/3 campos)"
      : "❌ No válido (requiere 3/3 campos)",
    erroresDetallados: errorMessages.length > 0 ? errorMessages : "Ninguno",
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
    errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
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
 * Busca la dirección en el texto extraído de la cuenta (VALIDACIÓN ESTRICTA)
 * Requiere obligatoriamente: número de calle + nombre de calle
 */
const findAddressInText = (
  extractedText: string,
  targetAddress: string
): { found: boolean; match?: string } => {
  console.log("🔍 Buscando dirección en texto extraído (MODO ESTRICTO)...");

  // Normalizar y limpiar la dirección objetivo
  const cleanTargetAddress = targetAddress
    .toLowerCase()
    .replace(/[.,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Dividir en palabras y separar números de palabras
  const addressWords = cleanTargetAddress.split(/\s+/).filter((word) => {
    return (
      word.length > 1 && // Palabras de más de 1 carácter
      !/^(de|del|la|las|el|los|con|sin|por|para|en|y)$/.test(word) // Excluir preposiciones
    );
  });

  // Separar números y palabras de calle
  const streetNumbers = addressWords.filter((word) => /^\d+$/.test(word));
  const streetWords = addressWords.filter((word) => !/^\d+$/.test(word));

  console.log("📍 Componentes de dirección:");
  console.log("  🔢 Números de calle:", streetNumbers);
  console.log("  📝 Palabras de calle:", streetWords);

  const normalizedExtracted = extractedText.toLowerCase();

  // VALIDACIÓN ESTRICTA: Verificar números de calle
  let numbersFound = 0;
  let numberMatches: string[] = [];

  for (const number of streetNumbers) {
    if (normalizedExtracted.includes(number)) {
      numbersFound++;
      numberMatches.push(number);
      console.log(`✅ NÚMERO DE CALLE ENCONTRADO: "${number}"`);
    } else {
      console.log(`❌ NÚMERO DE CALLE NO ENCONTRADO: "${number}"`);
    }
  }

  // VALIDACIÓN ESTRICTA: Verificar palabras del nombre de calle
  let streetWordsFound = 0;
  let streetWordMatches: string[] = [];

  for (const word of streetWords) {
    // Buscar coincidencia exacta
    if (normalizedExtracted.includes(word)) {
      streetWordsFound++;
      streetWordMatches.push(word);
      console.log(`✅ NOMBRE DE CALLE ENCONTRADO: "${word}"`);
    } else {
      // Permitir coincidencias parciales SOLO para abreviaciones comunes de calles
      const partialMatches = findPartialMatches(word, normalizedExtracted);
      if (partialMatches.length > 0) {
        streetWordsFound += 0.5; // Peso reducido para parciales
        streetWordMatches.push(`${word}~${partialMatches[0]}`);
        console.log(
          `🔍 Coincidencia parcial (calle): "${word}" ≈ "${partialMatches[0]}"`
        );
      } else {
        console.log(`❌ NOMBRE DE CALLE NO ENCONTRADO: "${word}"`);
      }
    }
  }

  // CRITERIO ESTRICTO:
  // 1. DEBE encontrar AL MENOS UN número de calle (si hay números en la dirección)
  // 2. DEBE encontrar AL MENOS UNA palabra significativa del nombre de calle
  const hasNumbersInAddress = streetNumbers.length > 0;
  const hasStreetWords = streetWords.length > 0;

  let isValid = false;
  let validationReason = "";

  if (hasNumbersInAddress && hasStreetWords) {
    // Caso normal: tiene números y palabras
    // REQUIERE: Al menos 1 número Y al menos 1 palabra de calle
    const hasRequiredNumber = numbersFound >= 1;
    const hasRequiredStreetName = streetWordsFound >= 1;

    isValid = hasRequiredNumber && hasRequiredStreetName;
    validationReason = hasRequiredNumber
      ? hasRequiredStreetName
        ? "✅ Número y nombre de calle encontrados"
        : "❌ Falta nombre de calle"
      : "❌ Falta número de calle";
  } else if (hasNumbersInAddress && !hasStreetWords) {
    // Solo tiene números (ej: "123")
    // REQUIERE: Todos los números
    isValid = numbersFound === streetNumbers.length;
    validationReason = isValid
      ? "✅ Número encontrado (sin nombre de calle en dirección)"
      : "❌ Número de calle no encontrado";
  } else if (!hasNumbersInAddress && hasStreetWords) {
    // Solo tiene palabras (ej: "Calle Principal")
    // REQUIERE: Al menos el 70% de las palabras
    const requiredWords = Math.max(1, Math.ceil(streetWords.length * 0.7));
    isValid = streetWordsFound >= requiredWords;
    validationReason = isValid
      ? "✅ Nombre de calle encontrado (sin número en dirección)"
      : "❌ Nombre de calle insuficiente";
  }

  const allMatches = [...numberMatches, ...streetWordMatches];

  console.log("📊 Análisis ESTRICTO de dirección:", {
    numerosEnDireccion: streetNumbers.length,
    numerosEncontrados: numbersFound,
    palabrasEnDireccion: streetWords.length,
    palabrasEncontradas: streetWordsFound.toFixed(1),
    validacion: validationReason,
    resultado: isValid ? "✅ VÁLIDA" : "❌ NO VÁLIDA",
  });

  return {
    found: isValid,
    match: isValid ? allMatches.join(" ") : undefined,
  };
};

/**
 * Busca la comuna en el texto extraído de la cuenta (MODO FLEXIBLE)
 * Acepta abreviaciones y coincidencias parciales comunes
 */
const findComunaInText = (
  extractedText: string,
  targetComuna: string
): { found: boolean; match?: string } => {
  console.log("🏘️ Buscando comuna en texto extraído (MODO FLEXIBLE)...");

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
      console.log(`✅ Comuna encontrada (exacta): "${word}"`);
    } else {
      // Para comunas, ser MUY flexible con coincidencias parciales
      // Ejemplo: "Las Condes" puede aparecer como "L. Condes", "Condes", etc.
      const partialMatches = findPartialMatches(word, normalizedExtracted);
      if (partialMatches.length > 0) {
        foundWords += 0.9; // Alto peso para coincidencias parciales en comunas
        foundMatches.push(`${word}~${partialMatches[0]}`);
        console.log(
          `✅ Comuna encontrada (parcial): "${word}" ≈ "${partialMatches[0]}"`
        );
      } else {
        console.log(`⚠️ Comuna no encontrada: "${word}" (no es crítico)`);
      }
    }
  }

  // VALIDACIÓN FLEXIBLE para comunas:
  // - Comunas de 1 palabra: requiere al menos 80% de coincidencia
  // - Comunas de 2+ palabras: requiere al menos 50% de coincidencia
  const wordsCount = comunaWords.length;
  const foundRatio = foundWords / wordsCount;

  let requiredThreshold: number;
  if (wordsCount === 1) {
    requiredThreshold = 0.8; // 80% para comunas de una palabra (ej: "Providencia")
  } else {
    requiredThreshold = 0.5; // 50% para comunas compuestas (ej: "Las Condes" puede ser "Condes")
  }

  // Permitir que pase con menos palabras encontradas si es comuna compuesta
  const minWordsFound = wordsCount === 1 ? 0.8 : 0.5;
  const found = foundRatio >= requiredThreshold && foundWords >= minWordsFound;

  console.log("📊 Análisis FLEXIBLE de comuna:", {
    totalPalabras: wordsCount,
    palabrasEncontradas: foundWords.toFixed(1),
    ratio: `${(foundRatio * 100).toFixed(1)}%`,
    requerido: `${(requiredThreshold * 100).toFixed(1)}%`,
    nota: "Validación flexible - acepta abreviaciones comunes",
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
