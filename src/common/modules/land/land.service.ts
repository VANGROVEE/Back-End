import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import {
  calculateDistance,
  getRadiusFromArea,
  isLandOverlapping,
} from "@/common/utils/geo";
import type { Land } from "@/generated/prisma/client";
import type { CreateLandDto } from "./land.dto";

class LandSerivces extends BaseService<Land, typeof prisma.land> {
  constructor() {
    super(prisma.land);
  }
  async createLand(userId: string, data: CreateLandDto) {
    const radiusBaru = getRadiusFromArea(data.total_area);

    const existingLands = await prisma.land.findMany({
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
        console.warn(
          `Data lahan ID ${land.id} memiliki lokasi yang tidak valid.`,
        );
        continue;
      }
      const jarakPusat = calculateDistance(
        data.location.latitude,
        data.location.longitude,
        loc.latitude,
        loc.longitude,
      );

      const radiusLama = getRadiusFromArea(land.total_area);

      if (isLandOverlapping(jarakPusat, radiusBaru, radiusLama)) {
        throw new ApiError(
          400,
          `Gagal mendaftar! Area ini bersinggungan dengan lahan '${land.name}'`,
        );
      }
    }

    return await prisma.land.create({
      data: {
        ...data,
        owner_id: userId,
      },
    });
  }
}

export const landService = new LandSerivces();
