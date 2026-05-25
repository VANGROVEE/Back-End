import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import type { PlantingCycle, STATUS } from "@/generated/prisma/client";
import type {
  CreatePlantingCycleDto,
  UpdatePlantingCycleDto,
} from "./planting-cycle.dto";

class PlantingCycleService extends BaseService<
  PlantingCycle,
  typeof prisma.plantingCycle
> {
  private readonly HEATMAP_CACHE_KEY = "planting-cycles:heatmap";

  constructor() {
    super(prisma.plantingCycle, "planting-cycles");
  }

  private async invalidateExtraCache() {
    await cacheHelper.deletePattern(`${this.HEATMAP_CACHE_KEY}:*`);
  }

  async createCycle(data: CreatePlantingCycleDto) {
    const activeCycle = await prisma.plantingCycle.findFirst({
      where: {
        land_id: data.land_id,
        commodity_id: data.commodity_id,
        status: { in: ["PLANTING", "HARVESTED"] },
      },
    });

    if (activeCycle) {
      throw new ApiError(
        400,
        "Lahan masih digunakan. Selesaikan siklus sebelumnya terlebih dahulu.",
      );
    }

    const landExists = await prisma.land.findUnique({
      where: { id: data.land_id },
      select: { id: true },
    });

    if (!landExists) throw new ApiError(404, "Lahan tidak ditemukan.");

    const result = await prisma.plantingCycle.create({
      data: {
        land_id: data.land_id,
        commodity_id: data.commodity_id,
        variety: data.variety,
        planting_method: data.planting_method,
        start_date: data.start_date,
        estimated_harvest: data.estimated_harvest,
        status: "PLANTING",
      },
    });

    await Promise.all([this.invalidateCache(), this.invalidateExtraCache()]);

    return result;
  }

  async updateCycle(id: string, data: UpdatePlantingCycleDto) {
    const cycleExists = await this.findById(id);

    if (data.land_id && data.land_id !== cycleExists.land_id) {
      const landExists = await prisma.land.findUnique({
        where: { id: data.land_id },
        select: { id: true },
      });
      if (!landExists) throw new ApiError(404, "Lahan tujuan tidak ditemukan.");
    }

    const result = await prisma.plantingCycle.update({
      where: { id },
      data: {
        ...data,
        status: data.status as STATUS,
      },
    });

    await Promise.all([
      this.invalidateCache({ id }),
      this.invalidateExtraCache(),
    ]);

    return result;
  }

  async getHeatmapCalendar(cycleId?: string) {
    const cacheKey = cycleId
      ? `${this.HEATMAP_CACHE_KEY}:${cycleId}`
      : `${this.HEATMAP_CACHE_KEY}:all`;

    return cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const activities = await prisma.dailyActivity.findMany({
          select: {
            activity_date: true,
            activity_type: true,
          },
          where: {
            ...(cycleId ? { cycle_id: cycleId } : {}),
            activity_date: { not: undefined },
          },
          orderBy: { activity_date: "asc" },
        });

        const heatmapData: Record<
          string,
          { count: number; types: Record<string, number> }
        > = {};

        activities.forEach((activity) => {
          const dateStr = activity.activity_date.toISOString().split("T")[0];
          if (!dateStr) return;

          if (!heatmapData[dateStr]) {
            heatmapData[dateStr] = { count: 0, types: {} };
          }

          heatmapData[dateStr].count += 1;
          const type = activity.activity_type;
          heatmapData[dateStr].types[type] =
            (heatmapData[dateStr].types[type] || 0) + 1;
        });

        return Object.entries(heatmapData).map(([date, data]) => {
          let dominantType = "OTHER";
          let maxCount = 0;

          for (const [type, count] of Object.entries(data.types)) {
            if (count > maxCount) {
              maxCount = count;
              dominantType = type;
            }
          }

          return {
            date,
            count: data.count,
            details: data.types,
            dominant_type: dominantType,
          };
        });
      },
      1800,
    );
  }
}

export const plantingCycleService = new PlantingCycleService();
