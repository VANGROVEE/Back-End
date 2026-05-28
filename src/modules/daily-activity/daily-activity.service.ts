import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import { calculateDistance, getRadiusFromArea } from "@/common/utils/geo";
import { Prisma, STATUS, type DailyActivity } from "@/generated/prisma/client";
import { landService } from "../land/land.service";
import type {
  AiRawResultDto,
  CreateDailyActivityDto,
} from "./daily-activity.dto";

type PrismaTransaction = Prisma.TransactionClient;

class DailyActivityService extends BaseService<
  DailyActivity,
  typeof prisma.dailyActivity
> {
  constructor() {
    super(prisma.dailyActivity, "daily-activities");
  }

  private async invalidateRelatedCaches(cycleId: string) {
    const cycle = await prisma.plantingCycle.findUnique({
      where: { id: cycleId },
      include: { land: true },
    });

    const promises: Promise<any>[] = [
      cacheHelper.deletePattern("analytics:dashboard"),

      cacheHelper.deletePattern(`daily-activities:*`),
      cacheHelper.deletePattern(`cache:*daily-activities*`),

      cacheHelper.deletePattern(`health-reports:*`),
      cacheHelper.delete(`health:reports-cycle:${cycleId}`),
      cacheHelper.deletePattern(`cache:*health*`),

      cacheHelper.deletePattern(`harvest-reports:*`),
      cacheHelper.deletePattern(`cache:*harvest*`),
      cacheHelper.delete(`planting-cycles:detail:${cycleId}`),
      cacheHelper.deletePattern(`planting-cycles:*`),

      cacheHelper.deletePattern(`cache:*heatmap*`),
      cacheHelper.deletePattern(`cache:*spatial*`),
    ];

    if (cycle) {
      const userId = cycle.land.owner_id;
      const landId = cycle.land_id;

      promises.push(
        cacheHelper.delete(`analytics:dashboard:spatial:${userId}`),
        cacheHelper.delete(`analytics:dashboard:health:${userId}`),

        landService.purgeLandCache(landId, userId),

        cacheHelper.deletePattern(`cache:*${userId}*`),
        cacheHelper.deletePattern(`cache:*${landId}*`),

        cacheHelper.delete(`harvest:dashboard:${userId}`),

        cacheHelper.deletePattern(`*${cycleId}*`),
      );
    }

    await Promise.all(promises);
  }

  async createActivity(data: CreateDailyActivityDto) {
    const cycle = await this.validateCycleOrThrow(
      data.cycle_id,
      data.activity_date,
    );

    const {
      total_yield_kg,
      image_proof_url,
      image_url,
      image_key,
      ai_raw_result,
      is_productive,
      ...cleanData
    } = data;

    const result = await prisma.$transaction(async (tx) => {
      const newActivity = await tx.dailyActivity.create({
        data: {
          cycle_id: cleanData.cycle_id,
          activity_date: cleanData.activity_date,
          activity_type: cleanData.activity_type,
          amount: cleanData.amount ?? null,
          unit: cleanData.unit ?? null,
          notes: cleanData.notes ?? null,
          weather_data:
            (cleanData.weather_data as Prisma.InputJsonValue) ??
            Prisma.JsonNull,
        },
      });

      let targetStatus: STATUS = "PLANTING";

      if (cleanData.activity_type === "HARVESTING") {
        await this.handleHarvesting(tx, data);
        targetStatus = is_productive === false ? "COMPLETED" : "HARVESTED";
      } else if (cleanData.activity_type === "OBSERVATION" && ai_raw_result) {
        await this.handleSaveAiReport(
          tx,
          cycle.id,
          image_url!,
          image_key!,
          ai_raw_result,
          cleanData.activity_date,
        );
        targetStatus = "PLANTING";
      }

      await tx.plantingCycle.update({
        where: { id: data.cycle_id },
        data: { status: targetStatus },
      });

      return newActivity;
    });

    await this.invalidateRelatedCaches(data.cycle_id);

    return result;
  }

  private async handleSaveAiReport(
    tx: PrismaTransaction,
    cycleId: string,
    url: string,
    key: string,
    aiData: AiRawResultDto,
    activityDate: Date,
  ) {
    const disease = await cacheHelper.getOrSet(
      `disease:label:${aiData.disease_name}`,
      async () => {
        return await prisma.disease.findUnique({
          where: { label_ai: aiData.disease_name },
        });
      },
    );

    const report = await tx.healthReport.create({
      data: {
        cycle_id: cycleId,
        disease_id: disease?.id || null,
        image_url: url,
        image_key: key,
        confidence_score: aiData.confidence_score,
        is_outbreak_trigger: aiData.is_dangerous,
        gemini_insight: aiData.insight as unknown as Prisma.InputJsonValue,
        created_at: activityDate,
      },
      include: {
        cycle: { include: { land: true } },
      },
    });

    if (aiData.is_dangerous && disease) {
      setImmediate(() => this.handleOutbreakAlert(report.cycle.land, disease));
    }

    return report;
  }

  private async handleOutbreakAlert(currentLand: any, disease: any) {
    const loc = currentLand.location as any;
    if (!loc?.latitude || !loc?.longitude) return;

    const otherLands = await cacheHelper.getOrSet(
      "lands:geo-data",
      async () => {
        return await prisma.land.findMany({
          where: { is_active: true },
          select: {
            owner_id: true,
            location: true,
            total_area: true,
            id: true,
          },
        });
      },
      1800,
    );

    const affectedFarmerIds = new Set<string>();
    const OUTBREAK_DANGER_RADIUS = 500;
    const radiusInfected = getRadiusFromArea(currentLand.total_area);

    otherLands.forEach((other) => {
      if (other.owner_id === currentLand.owner_id) return;

      const targetLoc = other.location as any;
      if (targetLoc?.latitude && targetLoc?.longitude) {
        const distance = calculateDistance(
          Number(loc.latitude),
          Number(loc.longitude),
          Number(targetLoc.latitude),
          Number(targetLoc.longitude),
        );

        const totalDangerZone =
          radiusInfected +
          getRadiusFromArea(other.total_area) +
          OUTBREAK_DANGER_RADIUS;

        if (distance <= totalDangerZone) affectedFarmerIds.add(other.owner_id);
      }
    });

    if (affectedFarmerIds.size > 0) {
      const farmerIds = Array.from(affectedFarmerIds);
      await prisma.notification.createMany({
        data: farmerIds.map((userId) => ({
          user_id: userId,
          title: `⚠️ Waspada Wabah: ${disease.name}`,
          message: `AI mendeteksi ${disease.name} di lahan sekitar Anda. Segera cek kondisi tanaman Anda.`,
          type: "OUTBREAK_ALERT",
        })),
      });

      for (const id of farmerIds) {
        await cacheHelper.deletePattern(`notifications:user:${id}:*`);
        await cacheHelper.deletePattern(`cache:*notifications*`);
        await cacheHelper.deletePattern(`cache:*${id}*`);
      }
    }
  }

  private async handleHarvesting(
    tx: PrismaTransaction,
    data: CreateDailyActivityDto,
  ) {
    await tx.plantingCycle.update({
      where: { id: data.cycle_id },
      data: {
        status: "HARVESTED",
        estimated_harvest: new Date(),
      },
    });

    return await tx.harvestReport.create({
      data: {
        cycle_id: data.cycle_id,
        total_yield_kg: data.total_yield_kg ?? 0,
        quality_grade: data.quality_grade ?? "PENDING_AI",
        image_proof_url: data.image_proof_url ?? null,

        ai_quality_metrics: Prisma.JsonNull,
      },
    });
  }

  private async validateCycleOrThrow(
    cycleId: string,
    activityDate: Date | string,
  ) {
    const cycle = await cacheHelper.getOrSet(
      `planting-cycles:detail:${cycleId}`,
      async () => {
        return await prisma.plantingCycle.findUnique({
          where: { id: cycleId },
          select: { id: true, status: true, start_date: true },
        });
      },
    );

    if (!cycle) throw new ApiError(404, "Siklus tanam tidak ditemukan.");

    const actDate = new Date(activityDate);
    const startDate = new Date(cycle.start_date);

    if (actDate < startDate) {
      throw new ApiError(
        400,
        "Tanggal aktivitas tidak boleh mendahului tanggal tanam.",
      );
    }

    if (["COMPLETED", "FAILED"].includes(cycle.status)) {
      throw new ApiError(400, "Siklus sudah ditutup.");
    }

    return cycle;
  }
}

export const dailyActivityService = new DailyActivityService();
