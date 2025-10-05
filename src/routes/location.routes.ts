import { Router } from "express";
import { PrismaClient } from "../generated/prisma";

const router = Router();
const prisma = new PrismaClient();

// GET /locations/regions - Obtener todas las regiones
router.get("/regions", async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: {
        name: "asc",
      },
    });
    res.json(regions);
  } catch (error) {
    console.error("Error al obtener regiones:", error);
    res.status(500).json({ error: "Error al obtener las regiones" });
  }
});

// GET /locations/regions/:regionId/comunas - Obtener comunas por región
router.get("/regions/:regionId/comunas", async (req, res) => {
  const { regionId } = req.params;
  
  try {
    const comunas = await prisma.comuna.findMany({
      where: {
        regionId: parseInt(regionId),
      },
      orderBy: {
        name: "asc",
      },
    });
    res.json(comunas);
  } catch (error) {
    console.error("Error al obtener comunas:", error);
    res.status(500).json({ error: "Error al obtener las comunas" });
  }
});

export default router;