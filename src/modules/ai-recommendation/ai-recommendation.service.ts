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

        const model = genAI.getGenerativeModel({
          model: "gemini-3.5-flash",
        });

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

  async analyzeCropFailure(cycleId: string) {
    // 1. Ambil data komprehensif (Semua variabel penyebab gagal)
    const cycle = await prisma.plantingCycle.findUnique({
      where: { id: cycleId },
      include: {
        land: true,
        commodity: true,
        daily_activities: {
          orderBy: { activity_date: "asc" },
        },
        health_reports: {
          include: { disease: true },
        },
        harvest_reports: true,
      },
    });

    if (!cycle) throw new ApiError(404, "Siklus tidak ditemukan");

    // 2. Persiapkan Variabel Mentah untuk AI
    const analysisContext = {
      komoditas: cycle.commodity.name,
      durasi_tanam_hari: Math.floor(
        (new Date().getTime() - cycle.start_date.getTime()) /
          (1000 * 3600 * 24),
      ),
      total_aktivitas: cycle.daily_activities.length,
      frekuensi_penyiraman: cycle.daily_activities.filter(
        (a) => a.activity_type === "WATERING",
      ).length,
      frekuensi_pemupukan: cycle.daily_activities.filter(
        (a) => a.activity_type === "FERTILIZING",
      ).length,
      riwayat_penyakit: cycle.health_reports.map((h) => ({
        tgl: h.created_at,
        penyakit: h.disease?.name,
        skor_keyakinan: h.confidence_score,
        is_outbreak: h.is_outbreak_trigger,
      })),
      catatan_aktivitas: cycle.daily_activities
        .map((a) => a.notes)
        .filter((n) => n),
      lokasi: cycle.land.location,
    };

    // 3. Panggil Model Gemini (Gunakan nama model yang BENAR)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // ✅ Diperbaiki dari 3.5 ke 1.5
    });

    const prompt = `
    Kamu adalah Investigator Forensik Pertanian Digital.
    Tugas: Menganalisis penyebab KEGAGALAN panen berdasarkan data berikut:
    ${JSON.stringify(analysisContext)}

    Tujuan:
    1. Identifikasi faktor utama kegagalan (Kurang air? Serangan hama yang terlambat ditangani? Nutrisi?).
    2. Berikan "Pelajaran Penting" agar petani tidak mengulangi kesalahan yang sama.
    3. Analisis apakah ada korelasi antara intensitas penyiraman dan penyakit yang muncul.

    Balas dengan format JSON:
    {
      "analisis_kegagalan": "String (Paragraf penjelasan teknis penyebab gagal)",
      "faktor_dominan": "AIR | PENYAKIT | PEMUPUKAN | CUACA | EKSTERNAL",
      "skor_kelalaian_manusia": Number (0-100),
      "rekomendasi_perbaikan_masa_depan": ["Array string langkah konkret"]
    }
  `;

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      return JSON.parse(result.response.text());
    } catch (error: any) {
      throw new ApiError(500, `Analisis AI Gagal: ${error.message}`);
    }
  },
};
