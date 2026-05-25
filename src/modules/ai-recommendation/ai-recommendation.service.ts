import { env } from "@/common/config/env";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { weatherUtils } from "@/common/utils/weather";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const aiRecommendationService = {
  async generateDailyRecommendation(cycleId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecommendation = await prisma.aiRecommendationLog.findUnique({
      where: {
        cycle_id_recommendation_date: {
          cycle_id: cycleId,
          recommendation_date: today,
        },
      },
    });

    if (existingRecommendation) {
      console.log("⚡ Mengambil rekomendasi dari Database (Hemat Token API)");
      return existingRecommendation;
    }

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
      throw new ApiError(
        400,
        "Lokasi lahan tidak memiliki format koordinat (latitude/longitude) yang valid.",
      );
    }

    const recentActivities = await prisma.dailyActivity.findMany({
      where: { cycle_id: cycleId },
      orderBy: { activity_date: "desc" },
      take: 3,
    });

    const latestHealthReport = await prisma.healthReport.findFirst({
      where: { cycle_id: cycleId },
      orderBy: { created_at: "desc" },
      include: { disease: true },
    });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const aiMemoryYesterday = await prisma.aiRecommendationLog.findFirst({
      where: {
        cycle_id: cycleId,
        recommendation_date: yesterday,
      },
    });

    const weatherForecast = await weatherUtils.getTomorrowForecast(
      location.latitude,
      location.longitude,
    );

    const simplifiedActivities =
      recentActivities.length > 0
        ? recentActivities.map((a) => ({
            tgl: a.activity_date.toISOString().split("T")[0],
            tipe: a.activity_type,
            jumlah: `${a.amount || 0} ${a.unit || ""}`.trim(),
          }))
        : "Belum ada aktivitas tercatat.";

    let statusKesehatanText = "Tanaman sehat, tidak ada laporan penyakit.";
    if (latestHealthReport) {
      if (latestHealthReport.is_outbreak_trigger) {
        statusKesehatanText = `AWAS! Terjadi wabah: ${latestHealthReport.disease?.name || "Penyakit tidak diketahui"}. Tingkat keparahan tinggi.`;
      } else if (latestHealthReport.disease_id) {
        statusKesehatanText = `Terditeksi penyakit: ${latestHealthReport.disease?.name || "Penyakit ringan"}. Butuh perhatian.`;
      }
    }

    const context = {
      riwayat_aktivitas: simplifiedActivities,
      status_kesehatan: statusKesehatanText,
      rekomendasi_kemarin:
        aiMemoryYesterday?.ai_response ||
        "Belum ada rekomendasi (Ini hari pertama)",
      cuaca_besok:
        weatherForecast ||
        "Data API cuaca gagal diambil, gunakan asumsi normal.",
    };

    const prompt = `
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

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    let aiResponseJson;
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      aiResponseJson = JSON.parse(result.response.text());
    } catch (error: any) {
      console.error("❌ [GEMINI ERROR]:", error?.message || error);
      throw new ApiError(
        500,
        `Gagal memproses rekomendasi AI: ${error?.message || "Internal AI Error"}`,
      );
    }

    try {
      const savedLog = await prisma.aiRecommendationLog.create({
        data: {
          cycle_id: cycleId,
          recommendation_date: today,
          ai_response: aiResponseJson,
          context_used: context as any,
        },
      });

      return savedLog;
    } catch (error: any) {
      console.error("❌ [PRISMA CREATE ERROR]:", error?.message || error);
      throw new ApiError(
        500,
        `Gagal menyimpan rekomendasi ke database: ${error?.message || "Database Error"}`,
      );
    }
  },
};
