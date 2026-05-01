import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import type { PlantingCycle } from "@/generated/prisma/client";
import type { CreatePlantingCycleDto } from "./planting-cycle.dto";

class PlantingCycleService extends BaseService<
  PlantingCycle,
  typeof prisma.plantingCycle
> {
  constructor() {
    super(prisma.plantingCycle);
  }

  override async create(data: CreatePlantingCycleDto) {
    const landExists = await prisma.land.findUnique({
      where: { id: data.land_id },
      select: { id: true },
    });

    if (!landExists) {
      throw new ApiError(404, "Lahan tidak ditemukan. Pastikan land_id benar.");
    }

    return await prisma.plantingCycle.create({
      data: {
        land_id: data.land_id,
        commodity_name: data.commodity_name,
        variety: data.variety,
        planting_method: data.planting_method,
        start_date: data.start_date,
        estimated_harvest: data.estimated_harvest,
        status: data.status,
      },
    });
  }
}

export const plantingCycleService = new PlantingCycleService();
