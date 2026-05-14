import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import {
  calculateDistance,
  getRadiusFromArea,
  isLandOverlapping,
} from "@/common/utils/geo";
import type { Land } from "@/generated/prisma/client";
import type { CreateLandDto, UpdateLandDto } from "./land.dto";

class LandSerivces extends BaseService<Land, typeof prisma.land> {
  constructor() {
    super(prisma.land);
  }

  async createLand(userId: string, data: CreateLandDto) {
    await this.validateOverlap(data.location, data.total_area);

    return await prisma.land.create({
      data: {
        ...data,
        owner_id: userId,
      },
    });
  }

  async findDetail(landId: string) {
    const data = await prisma.land.findUnique({
      where: {
        id: landId,
      },
      include: {
        owner: true,

        planting_cycles: {
          orderBy: {
            start_date: "desc",
          },
          include: {
            daily_activities: {
              orderBy: {
                activity_date: "desc",
              },
            },
          },
        },
      },
    });

    if (!data) {
      throw new ApiError(404, `Lahan dengan ID ${landId} tidak ditemukan.`);
    }

    const mappedData = {
      ...data,
    };

    return mappedData;
  }
  override async update(id: string, data: UpdateLandDto) {
    const currentLand = await prisma.land.findUnique({
      where: { id },
    });

    if (!currentLand) {
      throw new ApiError(404, "Lahan tidak ditemukan.");
    }

    if (data.location || data.total_area) {
      const newLocation = data.location || (currentLand.location as any);
      const newArea = data.total_area || currentLand.total_area;

      await this.validateOverlap(newLocation, newArea, id);
    }

    return await prisma.land.update({
      where: { id },
      data,
    });
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const landAggregations = await prisma.land.aggregate({
      _count: { id: true },
      _sum: { total_area: true },
    });

    const newLandsThisMonth = await prisma.land.count({
      where: {
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    const activeCycles = await prisma.plantingCycle.count({
      where: {
        status: "HARVESTED",
      },
    });

    return {
      total_lands: landAggregations._count.id || 0,
      new_lands_this_month: newLandsThisMonth || 0,
      total_area: landAggregations._sum.total_area || 0,
      active_cycles: activeCycles || 0,
    };
  }

  private async validateOverlap(
    location: { latitude: number; longitude: number },
    totalArea: number,
    excludeId?: string,
  ) {
    const radiusBaru = getRadiusFromArea(totalArea);

    const existingLands = await prisma.land.findMany({
      where: {
        id: excludeId ? { not: excludeId } : undefined,
      },
      select: {
        id: true,
        name: true,
        total_area: true,
        location: true,
      },
    });

    for (const land of existingLands) {
      const loc = land.location as { latitude: number; longitude: number };

      if (
        !loc ||
        typeof loc.latitude !== "number" ||
        typeof loc.longitude !== "number"
      ) {
        continue;
      }

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
          `Gagal memperbarui! Koordinat/luas baru bersinggungan dengan lahan '${land.name}'`,
        );
      }
    }
  }

  async getLands() {
    const data = await prisma.land.findMany({ include: { owner: true } });
    return data;
  }
}

export const landService = new LandSerivces();
