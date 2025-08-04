import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT!;
const MINIO_USER = process.env.MINIO_USER!;
const MINIO_PASS = process.env.MINIO_PASS!;
const URL_S3_UTILITYBILLS = process.env.URL_S3_UTILITYBILLS!;
const URL_S3_PROPERTY_IMAGES = process.env.URL_S3_PROPERTY_IMAGES!;

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: MINIO_ENDPOINT,
  credentials: {
    accessKeyId: MINIO_USER,
    secretAccessKey: MINIO_PASS,
  },
  forcePathStyle: true,
});

/**
 * Sube una imagen a MinIO/S3 desde un buffer
 * @param buffer Buffer de la imagen
 * @param filename Nombre del archivo
 * @returns URL pública del archivo subido
 */
export const uploadImageToBucket = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const uniqueName = `carnet-${Date.now()}-${filename}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: "utilitybills",
        Key: uniqueName,
        Body: buffer,
        ContentType: "image/jpeg",
      })
    );

    const url = `${URL_S3_UTILITYBILLS}${uniqueName}`;
    return url;
  } catch (err) {
    console.error("Error al subir imagen a S3:", err);
    throw new Error(
      "Error subiendo la imagen al bucket: " + (err as Error).message
    );
  }
};

/**
 * Sube archivos de imagenes de properties a MinIO/S3
 * @param buffer Buffer del archivo
 * @param filename Nombre del archivo
 * @returns URL pública del archivo subido
 */

export const uploadPropertyImageToBucket = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const uniqueName = `property-${Date.now()}-${filename}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: "properties",
        Key: uniqueName,
        Body: buffer,
        ContentType: "image/jpeg",
      })
    );

    const url = `${URL_S3_PROPERTY_IMAGES}${uniqueName}`;
    return url;
  } catch (err) {
    console.error("Error al subir imagen a S3:", err);
    throw new Error(
      "Error subiendo la imagen al bucket: " + (err as Error).message
    );
  }
};
