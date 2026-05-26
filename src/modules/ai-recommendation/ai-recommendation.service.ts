import { BaseService } from "@/common/base/service";
import { model } from "@/common/config/gemini";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { weatherUtils } from "@/common/utils/weather";
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
  constructor() {
    super(prisma.aiRecommendationLog, "ai-recommendationLog");
  }

  async findExisting(cycle_id: string, date: Date, type: RecommendationType) {
    return await this.model.findUnique({
      where: {
        cycle_id_recommendation_date_type: {
          cycle_id,
          recommendation_date: date,
          type,
        },
      },
    });
  }

  async saveAnalysis(
    cycle_id: string,
    type: RecommendationType,
    ai_response: any,
    context_used: any,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.model.upsert({
      where: {
        cycle_id_recommendation_date_type: {
          cycle_id,
          recommendation_date: today,
          type,
        },
      },
      create: {
        cycle_id,
        type,
        recommendation_date: today,
        ai_response,
        context_used,
      },
      update: {
        ai_response,
        context_used,
      },
    });
  }

  async getCycleContext(cycleId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);

    const cycle = await prisma.plantingCycle.findUnique({
      where: { id: cycleId },
      include: { land: true },
    });

    if (!cycle) throw new ApiError(404, "Siklus tanam tidak ditemukan");

    const location = cycle.land?.location as {
      latitude?: number;
      longitude?: number;
    } | null;
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
      weatherUtils.getTomorrowForecast(location.latitude, location.longitude),
    ]);

    const simplifiedActivities =
      recentActivities.length > 0
        ? recentActivities.map((a) => ({
            tgl: a.activity_date.toISOString().split("T")[0],
            tipe: a.activity_type,
            jumlah: `${a.amount || 0} ${a.unit || ""}`.trim(),
          }))
        : "Belum ada aktivitas tercatat.";

    const diseaseName =
      latestHealthReport?.disease?.name || "Penyakit tidak teridentifikasi";
    const statusKesehatanText = latestHealthReport
      ? latestHealthReport.is_outbreak_trigger
        ? `AWAS WABAH: ${diseaseName}`
        : `Terdeteksi penyakit: ${diseaseName}`
      : "Tanaman sehat.";

    return {
      riwayat_aktivitas: simplifiedActivities,
      status_kesehatan: statusKesehatanText,
      rekomendasi_kemarin: aiMemoryYesterday?.ai_response || "Hari pertama.",
      cuaca_besok: weatherForecast || "Gunakan asumsi normal.",
    };
  }

  async generateDailyAnalysis(context: any) {
    try {
      const prompt = `
        Kamu adalah AI Agri-tech spesialis Mangrove. 
        Data: ${JSON.stringify(context)}
        Balas HANYA dengan JSON murni: status_lingkungan_dan_kesehatan, rekomendasi_penyiraman (status, volume_liter, estimasi_hemat_kwh), rekomendasi_pemupukan (status, alasan), pesan_petani.
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      return JSON.parse(result.response.text());
    } catch (error: any) {
      throw new ApiError(500, `AI Daily Process Error: ${error?.message}`);
    }
  }

  async generateFailureAnalysis(cycleId: string) {
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
        analisis_kegagalan:
          "Analisis tidak dapat dilakukan karena tidak ditemukan catatan aktivitas harian.",
        faktor_dominan: "EKSTERNAL",
        skor_kelalaian_manusia: 0,
        rekomendasi_perbaikan_masa_depan: ["Mulai catat aktivitas harian."],
        _isMock: true, // Flag internal
      };
    }

    const analysisContext = {
      komoditas: cycle.commodity.name,
      durasi_tanam: Math.floor(
        (new Date().getTime() - cycle.start_date.getTime()) /
          (1000 * 3600 * 24),
      ),
      total_aktivitas: cycle.daily_activities.length,
      riwayat_penyakit: cycle.health_reports.map((h) => ({
        tgl: h.created_at,
        penyakit: h.disease?.name,
      })),
    };

    try {
      const prompt = `Analisis kegagalan panen Mangrove: ${JSON.stringify(analysisContext)}. Berikan JSON: analisis_kegagalan, faktor_dominan, skor_kelalaian_manusia, rekomendasi_perbaikan_masa_depan.`;
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });
      return JSON.parse(result.response.text());
    } catch (error: any) {
      throw new ApiError(500, `AI Failure Analysis Error: ${error.message}`);
    }
  }

  async findFirst(args: Prisma.AiRecommendationLogFindFirstArgs) {
    return await prisma.aiRecommendationLog.findFirst(args);
  }

  /** Metode upsert untuk simpan atau update data */
  async upsert(args: Prisma.AiRecommendationLogUpsertArgs) {
    return await prisma.aiRecommendationLog.upsert(args);
  }
}

export const aiRecommendationService = new AiRecommendationService();
