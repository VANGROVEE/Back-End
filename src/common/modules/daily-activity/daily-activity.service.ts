import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import type { DailyActivity } from "@/generated/prisma/client";
import type { CreateDailyActivityDto } from "./daily-activity.dto";

class DailyActivityService extends BaseService<
  DailyActivity,
  typeof prisma.dailyActivity
> {
  constructor() {
    super(prisma.dailyActivity);
  }

  async createActivity(data: CreateDailyActivityDto) {
    const cycle = await prisma.plantingCycle.findUnique({
      where: { id: data.cycle_id },
      select: { id: true, status: true },
    });

    if (!cycle) {
      throw new ApiError(404, "Siklus tanam tidak ditemukan.");
    }

    if (cycle.status !== "ACTIVE") {
      throw new ApiError(
        400,
        "Tidak dapat mencatat aktivitas pada siklus yang sudah tidak aktif.",
      );
    }

    return await prisma.dailyActivity.create({
      data: {
        ...data,

        weather_data: data.weather_data ?? undefined,
      },
    });
  }
}

export const dailyActivityService = new DailyActivityService();
