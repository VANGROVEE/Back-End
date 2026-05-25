import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import type { PlantingCycle, STATUS } from "@/generated/prisma/client";
import { landService } from "../land/land.service";
import type {
  CreatePlantingCycleDto,
  UpdatePlantingCycleDto,
} from "./planting-cycle.dto";

class PlantingCycleService extends BaseService<
  PlantingCycle,
  typeof prisma.plantingCycle
> {
  private readonly HEATMAP_PREFIX = "planting-cycles:heatmap";

  constructor() {
    super(prisma.plantingCycle, "planting-cycles");
  }

  async createCycle(data: CreatePlantingCycleDto) {
    const land = await prisma.land.findUnique({
      where: { id: data.land_id },
      select: { id: true, owner_id: true, is_active: true },
    });

    if (!land || !land.is_active) {
      throw new ApiError(404, "Lahan tidak ditemukan atau sudah tidak aktif.");
    }

    const activeCycle = await prisma.plantingCycle.findFirst({
      where: {
        land_id: data.land_id,
        status: { in: ["PLANTING", "HARVESTED"] },
      },
    });

    if (activeCycle) {
      throw new ApiError(
        400,
        "Lahan masih memiliki siklus aktif yang belum diselesaikan.",
      );
    }

    const startDate = new Date(data.start_date);
    if (isNaN(startDate.getTime())) {
      throw new ApiError(400, "Format tanggal mulai tidak valid.");
    }

    const result = await prisma.plantingCycle.create({
      data: {
        ...data,
        start_date: startDate,
        status: "PLANTING",
      },
    });

    await this.purgeCycleAndLandCache(result.id, land.id, land.owner_id);

    return result;
  }

  private async purgeCycleAndLandCache(
    cycleId?: string,
    landId?: string,
    userId?: string,
  ) {
    const promises: Promise<any>[] = [
      cacheHelper.deletePattern(`planting-cycles:*`),
      cacheHelper.deletePattern(`cache:*planting-cycle*`),
      cacheHelper.deletePattern(`cache:*heatmap*`),
    ];

    if (landId) {
      promises.push(landService.purgeLandCache(landId, userId));
    }

    await Promise.all(promises);
  }

  async updateCycle(id: string, data: UpdatePlantingCycleDto) {
    const current = await this.findById(id, {}, true);

    const result = await prisma.plantingCycle.update({
      where: { id },
      data: { ...data, status: data.status as STATUS },
    });

    await this.purgeCycleAndLandCache(id, current.land_id);
    if (data.land_id && data.land_id !== current.land_id) {
      await this.purgeCycleAndLandCache(id, data.land_id);
    }

    return result;
  }

  async deleteCycle(id: string) {
    const current = await this.findById(id, {}, true);
    const result = await prisma.plantingCycle.delete({ where: { id } });

    await this.purgeCycleAndLandCache(id, current.land_id);
    return result;
  }

  async getHeatmapCalendar(cycleId?: string) {
    const cacheKey = cycleId
      ? `${this.HEATMAP_PREFIX}:${cycleId}`
      : `${this.HEATMAP_PREFIX}:all`;

    return cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const activities = await prisma.dailyActivity.findMany({
          where: {
            ...(cycleId ? { cycle_id: cycleId } : {}),
            activity_date: { not: undefined },
          },
          orderBy: { activity_date: "asc" },
        });

        const heatmapData: Record<string, { date: string; count: number }> = {};

        activities.forEach((act) => {
          if (!act.activity_date) return;

          const dateParts = act.activity_date.toISOString().split("T");
          const dateStr = dateParts[0];

          if (typeof dateStr === "string") {
            if (!heatmapData[dateStr]) {
              heatmapData[dateStr] = { date: dateStr, count: 0 };
            }

            const currentEntry = heatmapData[dateStr];
            if (currentEntry) {
              currentEntry.count += 1;
            }
          }
        });

        return Object.values(heatmapData);
      },
      1800,
    );
  }
}

export const plantingCycleService = new PlantingCycleService();
