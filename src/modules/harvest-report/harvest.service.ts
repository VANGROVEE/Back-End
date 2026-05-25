import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { cacheHelper } from "@/common/utils/cache";
import type { HarvestReport } from "@/generated/prisma/client";

class HarvestReportService extends BaseService<
  HarvestReport,
  typeof prisma.harvestReport
> {
  constructor() {
    super(prisma.harvestReport, "harvest-reports");
  }

  private async invalidateExtraCache(userId: string) {
    await cacheHelper.delete(this.createUserKey(userId, "dashboard"));
  }

  async getDashboardData(userId: string) {
    const cacheKey = this.createUserKey(userId, "dashboard");

    return cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const [reports, allCycles] = await Promise.all([
          prisma.harvestReport.findMany({
            where: { cycle: { land: { owner_id: userId } } },
            include: {
              cycle: {
                include: { commodity: true },
              },
            },
            orderBy: { created_at: "desc" },
          }),

          prisma.plantingCycle.findMany({
            where: { land: { owner_id: userId } },
            include: {
              commodity: true,
              _count: { select: { daily_activities: true } },
              harvest_reports: { select: { total_yield_kg: true } },
            },
            orderBy: { start_date: "desc" },
          }),
        ]);

        const totalYield = reports.reduce(
          (acc, curr) => acc + (Number(curr.total_yield_kg) || 0),
          0,
        );

        const totalCycles = allCycles.length;
        const finishedCycles = allCycles.filter(
          (c) => c.status === "COMPLETED",
        ).length;

        const successRate =
          totalCycles > 0
            ? Math.round((finishedCycles / totalCycles) * 100)
            : 0;

        const formattedCycles = allCycles.map((cycle) => ({
          id: cycle.id,
          status: cycle.status,
          variety: cycle.variety,
          start_date: cycle.start_date,
          end_date: cycle.estimated_harvest,
          commodity: cycle.commodity,
          activity_count: cycle._count.daily_activities,
          total_yield: String(
            cycle.harvest_reports.reduce(
              (acc, curr) => acc + Number(curr.total_yield_kg),
              0,
            ),
          ),
          ai_explanation:
            cycle.status === "FAILED"
              ? (cycle as any).failure_note ||
                "AI mendeteksi anomali pada siklus air dan nutrisi yang menyebabkan gagal panen."
              : null,
        }));

        return {
          stats: {
            total_yield_kg: String(totalYield),
            harvest_count: String(reports.length),
            success_rate: String(successRate),
          },
          history: reports,
          cycles: formattedCycles,
        };
      },
      1800,
    );
  }

  async getReportDetail(reportId: string) {
    return cacheHelper.getOrSet(this.getDetailKey(reportId), async () => {
      return await prisma.harvestReport.findUnique({
        where: { id: reportId },
        include: {
          cycle: {
            include: {
              land: true,
              commodity: true,
            },
          },
        },
      });
    });
  }

  async createReport(userId: string, data: any) {
    const result = await prisma.harvestReport.create({ data });

    await Promise.all([
      this.invalidateCache(),
      this.invalidateExtraCache(userId),
    ]);

    return result;
  }

  async updateReport(id: string, userId: string, data: any) {
    const result = await prisma.harvestReport.update({
      where: { id },
      data,
    });

    await Promise.all([
      this.invalidateCache({ id }),
      this.invalidateExtraCache(userId),
    ]);

    return result;
  }
}

export const harvestReportService = new HarvestReportService();
