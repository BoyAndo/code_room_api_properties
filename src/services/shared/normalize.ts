export const normalize = (str: string) =>
  str
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina las tildes
    .replace(/[^\w\s]/g, "") // elimina símbolos raros (opcional, solo letras, números y espacios)
    .replace(/\s+/g, " ") // convierte múltiples espacios en uno solo
    .trim() // elimina espacios al inicio y final
    .toLowerCase(); // pasa todo a minúsculas // elimina espacios

export const allWordsExist = (nameBase: string, nameCheck: string): boolean => {
  const baseWords = normalize(nameBase).split(" ");
  const checkWords = normalize(nameCheck).split(" ");
  // Retorna true si TODAS las palabras de nameCheck están en nameBase
  return checkWords.every((word) => baseWords.includes(word));
};

/**
 * Verifica si un porcentaje mínimo de palabras coinciden
 * @param words1 Array de palabras del primer texto
 * @param words2 Array de palabras del segundo texto
 * @param threshold Porcentaje mínimo de coincidencia (0.0 a 1.0)
 * @returns true si el porcentaje de coincidencia es mayor o igual al threshold
 */
export const wordsMatchPercentage = (
  words1: string[],
  words2: string[],
  threshold: number = 0.8
): boolean => {
  if (words1.length === 0 || words2.length === 0) return false;

  const normalizedWords1 = words1.map((word) => normalize(word));
  const normalizedWords2 = words2.map((word) => normalize(word));

  // Contar coincidencias
  let matches = 0;
  normalizedWords1.forEach((word1) => {
    if (
      normalizedWords2.some(
        (word2) => word2.includes(word1) || word1.includes(word2)
      )
    ) {
      matches++;
    }
  });

  const matchPercentage =
    matches / Math.max(normalizedWords1.length, normalizedWords2.length);
  return matchPercentage >= threshold;
};
