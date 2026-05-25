import { env } from "@/common/config/env";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import { weatherUtils } from "@/common/utils/weather";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const aiRecommendationService = {
  getDailyCacheKey(cycleId: string, date: Date) {
    const dateStr = date.toISOString().split("T")[0];
    return `ai:recommendation:${cycleId}:${dateStr}`;
  },

  async generateDailyRecommendation(cycleId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cacheKey = this.getDailyCacheKey(cycleId, today);

    return await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const existingRecommendation =
          await prisma.aiRecommendationLog.findUnique({
            where: {
              cycle_id_recommendation_date: {
                cycle_id: cycleId,
                recommendation_date: today,
              },
            },
          });

        if (existingRecommendation) return existingRecommendation;

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

        const yesterdayDate = new Date(today);
        yesterdayDate.setDate(today.getDate() - 1);

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
            },
          }),
          weatherUtils.getTomorrowForecast(
            location.latitude,
            location.longitude,
          ),
        ]);

        const simplifiedActivities =
          recentActivities.length > 0
            ? recentActivities.map((a) => ({
                tgl: a.activity_date.toISOString().split("T")[0],
                tipe: a.activity_type,
                jumlah: `${a.amount || 0} ${a.unit || ""}`.trim(),
              }))
            : "Belum ada aktivitas tercatat.";

        let statusKesehatanText = "Tanaman sehat.";
        if (latestHealthReport) {
          statusKesehatanText = latestHealthReport.is_outbreak_trigger
            ? `AWAS WABAH: ${latestHealthReport.disease?.name}`
            : `Terdeteksi penyakit: ${latestHealthReport.disease?.name}`;
        }

        const context = {
          riwayat_aktivitas: simplifiedActivities,
          status_kesehatan: statusKesehatanText,
          rekomendasi_kemarin:
            aiMemoryYesterday?.ai_response || "Hari pertama.",
          cuaca_besok: weatherForecast || "Gunakan asumsi normal.",
        };

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let aiResponseJson;
        try {
          const promptText = await this.buildPrompt(context);
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          });

          aiResponseJson = JSON.parse(result.response.text());
        } catch (error: any) {
          throw new ApiError(500, `AI Process Error: ${error?.message}`);
        }

        const savedLog = await prisma.aiRecommendationLog.create({
          data: {
            cycle_id: cycleId,
            recommendation_date: today,
            ai_response: aiResponseJson,
            context_used: context as any,
          },
        });

        await cacheHelper.delete("analytics:ai-performance");

        return savedLog;
      },
      43200,
    );
  },

  async buildPrompt(context: any) {
    return `
      Kamu adalah AI Agri-tech spesialis Mangrove dan Efisiensi Energi di sistem Vangrove.
      Konteks data saat ini:
      ${JSON.stringify(context)}

      ATURAN BISNIS:
      1. Jika riwayat aktivitas "Belum ada", berikan rekomendasi awal tanam.
      2. Jika cuaca_besok memprediksi hujan lebat (>60%), hentikan penyiraman untuk hemat listrik.
      3. PERHATIKAN status_kesehatan! Jika ada penyakit/wabah, sarankan tindakan karantina atau pemupukan khusus di "pesan_petani", dan tunda penyiraman berlebih jika penyakit disebabkan jamur.
      
      Balas HANYA dengan objek JSON murni dengan struktur:
      {
        "status_lingkungan_dan_kesehatan": "String (Rangkuman kondisi lahan dan kesehatan bibit)",
        "rekomendasi_penyiraman": {
          "status": "LAKUKAN_PENYIRAMAN_PENUH | LAKUKAN_PENYIRAMAN_RINGAN | JANGAN_SIRAM",
          "volume_liter": Number,
          "estimasi_hemat_kwh": Number
        },
        "rekomendasi_pemupukan": {
          "status": "BERIKAN_PUPUK | JANGAN_PUPUK | BERIKAN_OBAT",
          "alasan": "String"
        },
        "pesan_petani": "String (Peringatan penyakit jika ada, atau motivasi harian)"
      }
    `;
  },
};
