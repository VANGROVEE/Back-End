import { BaseService } from "@/common/base/service";
import { model } from "@/common/config/gemini";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { weatherUtils } from "@/common/utils/weather";
import { cacheHelper } from "@/common/utils/cache";
import { landService } from "../land/land.service";
import type {
  AiRecommendationLog,
  Prisma,
  RecommendationType,
} from "@/generated/prisma/client";
import { STATUS } from "@/generated/prisma/enums";

class AiRecommendationService extends BaseService<
  AiRecommendationLog,
  typeof prisma.aiRecommendationLog
> {
  private readonly AI_CACHE_PREFIX = "ai-recommendations";

  constructor() {
    super(prisma.aiRecommendationLog, "ai-recommendationLog");
  }

  /**
   * Mengadopsi pola invalidateRelatedCaches dari DailyActivityService
   * Memastikan sinkronisasi antara AI, Land, dan Dashboard
   */
  public async purgeAiCache(cycleId?: string, userId?: string) {
    const patterns = [
      `${this.AI_CACHE_PREFIX}:*`,
      `cache:*ai-recommendation*`,
      `cache:ai-context:*`,
      `harvest:dashboard:*`,
      `analytics:*`,
    ];

    const promises: Promise<any>[] = patterns.map((p) =>
      cacheHelper.deletePattern(p),
    );

    if (cycleId) {
      const cycle = await prisma.plantingCycle.findUnique({
        where: { id: cycleId },
        select: { land_id: true, land: { select: { owner_id: true } } },
      });

      if (cycle) {
        promises.push(
          landService.purgeLandCache(cycle.land_id, cycle.land.owner_id),
        );
        promises.push(cacheHelper.deletePattern(`*${cycleId}*`));
      }
    }

    if (userId) {
      promises.push(cacheHelper.deletePattern(`cache:*${userId}*`));
      promises.push(cacheHelper.delete(`harvest:dashboard:${userId}`));
    }

    await Promise.all(promises);
  }

  /** Implementasi cache-aside pattern untuk pencarian log */
  async findExisting(cycle_id: string, date: Date, type: RecommendationType) {
    const dateStr = date.toISOString().split("T")[0];
    const cacheKey = `${this.AI_CACHE_PREFIX}:log:${type}:${cycle_id}:${dateStr}`;

    return await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        return await this.model.findFirst({
          where: { cycle_id, recommendation_date: date, type },
        });
      },
      3600,
    );
  }

  /** Simpan analisis dengan invalidasi cache yang agresif */
  async saveAnalysis(
    cycle_id: string,
    type: RecommendationType,
    ai_response: any,
    context_used: any,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      return await tx.aiRecommendationLog.upsert({
        where: {
          cycle_id_recommendation_date_type: {
            cycle_id,
            recommendation_date: today,
            type,
          },
        },
        update: { ai_response, context_used },
        create: {
          cycle_id,
          type,
          recommendation_date: today,
          ai_response,
          context_used,
        },
      });
    });

    await this.purgeAiCache(cycle_id);

    return result;
  }

  /** Mengambil konteks siklus dengan caching yang dioptimasi */
  async getCycleContext(cycleId: string) {
    const cacheKey = `cache:ai-context:cycle:${cycleId}`;

    return await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(today.getDate() - 1);

        const cycle = await prisma.plantingCycle.findUnique({
          where: { id: cycleId },
          include: { land: true },
        });

        if (!cycle) throw new ApiError(404, "Siklus tanam tidak ditemukan");

        const location = cycle.land?.location as any;
        if (!location?.latitude || !location?.longitude) {
          throw new ApiError(400, "Koordinat lokasi lahan tidak valid.");
        }

        const [
          recentActivities,
          latestHealthReport,
          aiMemoryYesterday,
          weatherForecast,
        ] = await Promise.all([
          prisma.dailyActivity.findMany({
            where: { cycle_id: cycleId },
            orderBy: { activity_date: "desc" },
            take: 3,
          }),
          prisma.healthReport.findFirst({
            where: { cycle_id: cycleId },
            orderBy: { created_at: "desc" },
            include: { disease: true },
          }),
          prisma.aiRecommendationLog.findFirst({
            where: {
              cycle_id: cycleId,
              recommendation_date: yesterdayDate,
              type: "DAILY",
            },
          }),
          weatherUtils.getTomorrowForecast(
            location.latitude,
            location.longitude,
          ),
        ]);

        return {
          riwayat_aktivitas:
            recentActivities.length > 0
              ? recentActivities.map((a) => ({
                  tgl: a.activity_date.toISOString().split("T")[0],
                  tipe: a.activity_type,
                  jumlah: `${a.amount || 0} ${a.unit || ""}`.trim(),
                }))
              : "Belum ada aktivitas.",
          status_kesehatan: latestHealthReport
            ? `${latestHealthReport.is_outbreak_trigger ? "AWAS: " : ""}${latestHealthReport.disease?.name}`
            : "Tanaman sehat.",
          rekomendasi_kemarin: aiMemoryYesterday?.ai_response || "N/A",
          cuaca_besok: weatherForecast || "Normal",
        };
      },
      1800,
    );
  }

  async generateDailyAnalysis(context: any) {
    const contextHash = Buffer.from(JSON.stringify(context))
      .toString("base64")
      .substring(0, 16);
    const cacheKey = `${this.AI_CACHE_PREFIX}:raw:daily:${contextHash}`;

    return await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        try {
          const prompt = `Kamu adalah AI Agri-tech Mangrove. Data: ${JSON.stringify(context)}. Balas HANYA JSON: status_lingkungan_dan_kesehatan, rekomendasi_penyiraman (status, volume_liter, estimasi_hemat_kwh), rekomendasi_pemupukan (status, alasan), pesan_petani.`;

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          });

          return JSON.parse(result.response.text());
        } catch (error: any) {
          throw new ApiError(500, `AI Error: ${error?.message}`);
        }
      },
      43200,
    );
  }

  async generateFailureAnalysis(cycleId: string) {
    const cacheKey = `${this.AI_CACHE_PREFIX}:raw:failure:${cycleId}`;

    return await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const cycle = await prisma.plantingCycle.findUnique({
          where: { id: cycleId, status: STATUS.FAILED },
          include: {
            land: true,
            commodity: true,
            daily_activities: { orderBy: { activity_date: "asc" } },
            health_reports: { include: { disease: true } },
          },
        });

        if (!cycle) throw new ApiError(404, "Siklus gagal tidak ditemukan");
        if (cycle.daily_activities.length === 0) {
          return {
            analisis_kegagalan: "Data aktivitas kosong.",
            faktor_dominan: "DATA_MISSING",
            skor_kelalaian_manusia: 0,
            rekomendasi_perbaikan_masa_depan: ["Mulai catat aktivitas harian."],
          };
        }

        const analysisContext = {
          komoditas: cycle.commodity.name,
          total_aktivitas: cycle.daily_activities.length,
          riwayat_penyakit: cycle.health_reports.map((h) => h.disease?.name),
        };

        const prompt = `Analisis kegagalan Mangrove: ${JSON.stringify(analysisContext)}. Berikan JSON: analisis_kegagalan, faktor_dominan, skor_kelalaian_manusia, rekomendasi_perbaikan_masa_depan.`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });

        return JSON.parse(result.response.text());
      },
      86400,
    );
  }

  async findFirst(args: Prisma.AiRecommendationLogFindFirstArgs) {
    return await prisma.aiRecommendationLog.findFirst(args);
  }

  async upsert(args: Prisma.AiRecommendationLogUpsertArgs) {
    const result = await prisma.aiRecommendationLog.upsert(args);
    await this.purgeAiCache();
    return result;
  }
}

export const aiRecommendationService = new AiRecommendationService();
