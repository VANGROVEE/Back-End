import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { utapi } from "@/common/lib/uploadthing";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import { Prisma, type HealthReport } from "@/generated/prisma/client";
import type { CreateHealthReportDto } from "./health.dto";

class HealthService extends BaseService<
  HealthReport,
  typeof prisma.healthReport
> {
  private readonly HEALTH_STATS_KEY = "health:stats";

  constructor() {
    super(prisma.healthReport, "health-reports");
  }

  private async invalidateExtraCache(cycleId?: string) {
    const promises: Promise<any>[] = [
      cacheHelper.delete(this.HEALTH_STATS_KEY),

      cacheHelper.deletePattern(`${this.cachePrefix}:*`),

      cacheHelper.deletePattern(`cache:*health*`),
    ];

    if (cycleId) {
      promises.push(cacheHelper.delete(`health:reports-cycle:${cycleId}`));

      promises.push(cacheHelper.deletePattern(`*${cycleId}*`));
    }

    await Promise.all(promises);
  }

  async getReportsByCycle(cycleId: string) {
    const cacheKey = `health:reports-cycle:${cycleId}`;

    return cacheHelper.getOrSet(
      cacheKey,
      async () => {
        return await prisma.healthReport.findMany({
          where: { cycle_id: cycleId },
          include: {
            disease: true,
          },
          orderBy: { created_at: "desc" },
        });
      },
      1800,
    );
  }

  async createHealthReport(dto: CreateHealthReportDto) {
    const cycle = await prisma.plantingCycle.findUnique({
      where: { id: dto.cycle_id },
      include: { commodity: true },
    });

    if (!cycle) {
      if (dto.image_key) await utapi.deleteFiles(dto.image_key);
      throw new ApiError(404, "Siklus tanam tidak ditemukan.");
    }

    const report = await prisma.healthReport.create({
      data: {
        cycle_id: dto.cycle_id,
        image_url: dto.image_url,
        image_key: dto.image_key,

        confidence_score: 1.0,
        is_outbreak_trigger: false,
        gemini_insight: Prisma.JsonNull,
      },
    });

    await this.invalidateExtraCache(dto.cycle_id);
    return report;
  }

  async deleteReport(id: string) {
    const report = await this.findById(id);

    if (report.image_key) {
      try {
        await utapi.deleteFiles(report.image_key);
      } catch (err) {
        console.error("Gagal menghapus file di UploadThing:", err);
      }
    }

    const result = await prisma.healthReport.delete({
      where: { id },
    });

    await this.invalidateExtraCache(report.cycle_id);
    return result;
  }

  async getHealthStats() {
    return cacheHelper.getOrSet(
      this.HEALTH_STATS_KEY,
      async () => {
        const totalReports = await prisma.healthReport.count();
        const outbreakTriggers = await prisma.healthReport.count({
          where: { is_outbreak_trigger: true },
        });

        return { totalReports, outbreakTriggers };
      },
      3600,
    );
  }
}

export const healthService = new HealthService();
