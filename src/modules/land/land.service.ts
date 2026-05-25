import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import {
  calculateDistance,
  getRadiusFromArea,
  isLandOverlapping,
} from "@/common/utils/geo";
import type { Land } from "@/generated/prisma/client";
import type { CreateLandDto, UpdateLandDto } from "./land.dto";

class LandServices extends BaseService<Land, typeof prisma.land> {
  private readonly LAND_STATS_KEY = "lands:stats";
  private readonly LAND_GEO_DATA_KEY = "lands:geo-data";

  constructor() {
    super(prisma.land, "lands");
  }

  private async invalidateExtraCache() {
    await cacheHelper.delete([this.LAND_STATS_KEY, this.LAND_GEO_DATA_KEY]);
  }

  async findDetail(landId: string) {
    const cacheKey = this.getDetailKey(landId);

    return cacheHelper.getOrSet(cacheKey, async () => {
      const data = await prisma.land.findUnique({
        where: { id: landId, is_active: true },
        include: {
          owner: true,
          planting_cycles: {
            orderBy: { start_date: "desc" },
            include: {
              commodity: true,
              daily_activities: { orderBy: { activity_date: "desc" } },
            },
          },
        },
      });

      if (!data) throw new ApiError(404, `Lahan tidak ditemukan.`);
      return data;
    });
  }

  async createLand(userId: string, data: CreateLandDto) {
    await this.validateOverlap(data.location, data.total_area);

    const result = await prisma.land.create({
      data: { ...data, owner_id: userId },
    });

    await Promise.all([
      this.invalidateCache({ userId }),
      this.invalidateExtraCache(),
    ]);

    return result;
  }

  async updateLand(id: string, data: UpdateLandDto) {
    const currentLand = await this.findById(id);

    if (data.location || data.total_area) {
      const newLocation = data.location || (currentLand.location as any);
      const newArea = data.total_area || currentLand.total_area;
      await this.validateOverlap(newLocation, newArea, id);
    }

    const result = await prisma.land.update({
      where: { id },
      data,
    });

    await Promise.all([
      this.invalidateCache({ id, userId: currentLand.owner_id }),
      this.invalidateExtraCache(),
    ]);

    return result;
  }

  async getStats() {
    return cacheHelper.getOrSet(
      this.LAND_STATS_KEY,
      async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [landAggregations, newLandsThisMonth, activeCycles] =
          await Promise.all([
            prisma.land.aggregate({
              _count: { id: true },
              _sum: { total_area: true },
            }),
            prisma.land.count({
              where: { created_at: { gte: startOfMonth } },
            }),
            prisma.plantingCycle.count({
              where: { status: "HARVESTED" },
            }),
          ]);

        return {
          total_lands: String(landAggregations._count.id || 0),
          new_lands_this_month: String(newLandsThisMonth || 0),
          total_area: String(landAggregations._sum.total_area || 0),
          active_cycles: String(activeCycles || 0),
        };
      },
      3600,
    );
  }

  async softDelete(id: string) {
    const currentLand = await this.findById(id);

    const result = await prisma.land.update({
      where: { id },
      data: { is_active: false, deleted_at: new Date() },
    });

    await Promise.all([
      this.invalidateCache({ id, userId: currentLand.owner_id }),
      this.invalidateExtraCache(),
    ]);

    return result;
  }

  private async validateOverlap(
    location: { latitude: number; longitude: number },
    totalArea: number,
    excludeId?: string,
  ) {
    const radiusBaru = getRadiusFromArea(totalArea);

    const existingLands = await cacheHelper.getOrSet(
      this.LAND_GEO_DATA_KEY,
      async () => {
        return await prisma.land.findMany({
          where: { is_active: true },
          select: { id: true, name: true, total_area: true, location: true },
        });
      },
      1800,
    );

    for (const land of existingLands) {
      if (land.id === excludeId) continue;

      const loc = land.location as { latitude: number; longitude: number };
      if (!loc?.latitude || !loc?.longitude) continue;

      const jarakPusat = calculateDistance(
        location.latitude,
        location.longitude,
        loc.latitude,
        loc.longitude,
      );

      const radiusLama = getRadiusFromArea(land.total_area);

      if (isLandOverlapping(jarakPusat, radiusBaru, radiusLama)) {
        throw new ApiError(
          400,
          `Koordinat/luas bersinggungan dengan lahan '${land.name}'`,
        );
      }
    }
  }

  async getLands() {
    return this.findAll({ include: { owner: true } });
  }
}

export const landService = new LandServices();
