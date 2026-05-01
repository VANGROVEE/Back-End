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
}

export const landService = new LandSerivces();
