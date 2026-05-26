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
        start_date: data.start_date,
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
      cacheHelper.deletePattern(`cache:*analytics*`),
      cacheHelper.deletePattern(`cache:*dashboard*`),
    ];

    if (userId) {
      promises.push(
        cacheHelper.delete(this.createUserKey(userId, "dashboard")),
      );

      promises.push(cacheHelper.deletePattern(`*${userId}:dashboard*`));
    }

    if (cycleId) {
      promises.push(cacheHelper.delete(`${this.HEATMAP_PREFIX}:${cycleId}`));
      promises.push(cacheHelper.deletePattern(`*${cycleId}*`));
    }

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

          select: {
            activity_date: true,
            activity_type: true,
          },
        });

        const tempMap: Record<
          string,
          {
            date: string;
            count: number;
            types: Record<string, number>;
          }
        > = {};

        activities.forEach((act) => {
          if (!act || !act.activity_date) return;

          const dateObj = new Date(act.activity_date);
          if (isNaN(dateObj.getTime())) return;

          const parts = dateObj.toISOString().split("T");
          const dateStr = parts[0];

          if (!dateStr || typeof dateStr !== "string") return;

          if (!tempMap[dateStr]) {
            tempMap[dateStr] = {
              date: dateStr,
              count: 0,
              types: {},
            };
          }

          const entry = tempMap[dateStr];

          if (entry) {
            entry.count += 1;

            const type = act.activity_type;

            if (type) {
              entry.types[type] = (entry.types[type] || 0) + 1;
            }
          }
        });

        return Object.values(tempMap).map((item) => {
          const dominantType = Object.entries(item.types).reduce((a, b) =>
            b[1] > a[1] ? b : a,
          )[0];

          return {
            date: item.date,
            count: item.count,
            dominant_type: dominantType,
          };
        });
      },
      1800,
    );
  }
}

export const plantingCycleService = new PlantingCycleService();
