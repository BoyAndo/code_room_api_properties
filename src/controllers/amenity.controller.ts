import { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Obtener todos los amenities disponibles
 */
export const getAmenitiesController = async (req: Request, res: Response) => {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        category: true,
      },
    });

    // Agrupar por categoría para mejor UX
    const groupedAmenities = amenities.reduce(
      (acc: Record<string, typeof amenities>, amenity) => {
        const category = amenity.category || "other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(amenity);
        return acc;
      },
      {} as Record<string, typeof amenities>
    );

    res.json({
      success: true,
      data: {
        amenities,
        grouped: groupedAmenities,
        total: amenities.length,
        categories: Object.keys(groupedAmenities),
      },
    });
  } catch (error) {
    console.error("❌ Error obteniendo amenities:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
