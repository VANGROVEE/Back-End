import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { utapi } from "@/common/lib/uploadthing";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import type { HealthReport } from "@/generated/prisma/client";
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
    ];

    if (cycleId) {
      promises.push(cacheHelper.delete(`health:reports-cycle:${cycleId}`));
    }

    await Promise.all(promises);
  }

  async createReportWithAI(dto: CreateHealthReportDto) {
    const cycle = await cacheHelper.getOrSet(
      `cycle:ai-check:${dto.cycle_id}`,
      async () => {
        return await prisma.plantingCycle.findUnique({
          where: { id: dto.cycle_id },
          include: { commodity: true },
        });
      },
      1800,
    );

    if (!cycle) {
      await utapi.deleteFiles(dto.image_key);
      throw new ApiError(404, "Siklus tanam tidak ditemukan.");
    }

    if (!cycle.commodity.is_ai_supported) {
      await utapi.deleteFiles(dto.image_key);
      throw new ApiError(
        400,
        "Komoditas ini belum mendukung fitur analisis AI.",
      );
    }

    const report = await prisma.healthReport.create({
      data: {
        cycle_id: dto.cycle_id,
        image_url: dto.image_url,
        image_key: dto.image_key,
        analysis_result: "Healthy",
        confidence_score: 0.95,
        recommendation: "Lanjutkan pemeliharaan rutin.",
      },
    });

    await Promise.all([
      this.invalidateCache(),
      this.invalidateExtraCache(dto.cycle_id),
    ]);

    return report;
  }

  async getReportsByCycle(cycleId: string) {
    const cacheKey = `health:reports-cycle:${cycleId}`;

    return cacheHelper.getOrSet(cacheKey, async () => {
      return await prisma.healthReport.findMany({
        where: { cycle_id: cycleId },
        orderBy: { created_at: "desc" },
      });
    });
  }

  async deleteReport(id: string) {
    const report = await this.findById(id);

    if (report.image_key) {
      await utapi.deleteFiles(report.image_key);
    }

    const result = await prisma.healthReport.delete({
      where: { id },
    });

    await Promise.all([
      this.invalidateCache({ id }),
      this.invalidateExtraCache(report.cycle_id),
    ]);

    return result;
  }
}

export const healthService = new HealthService();
