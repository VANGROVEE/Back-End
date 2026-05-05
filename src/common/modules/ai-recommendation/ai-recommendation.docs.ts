import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";

export const getAiRecommendationSchema = z.object({
  params: z.object({
    cycleId: z.string().uuid("cycleId harus berupa format UUID yang valid"),
  }),
});

registry.registerPath({
  method: "get",
  path: "/ai-recommendation/{cycleId}",
  tags: ["AI Recommendation"],
  summary: "Generate/Ambil Rekomendasi AI Harian",
  description:
    "Menghasilkan rekomendasi cerdas dari Gemini AI untuk penyiraman, penghematan energi pompa (kWh), dan pemupukan berdasarkan prediksi cuaca OpenWeather dan riwayat kesehatan. Jika rekomendasi hari ini sudah dibuat, sistem akan mengembalikan data dari cache (database).",
  request: {
    params: getAiRecommendationSchema.shape.params,
  },
  responses: {
    200: {
      description: "Berhasil mendapatkan rekomendasi AI",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
            data: z.any(),
          }),
          example: {
            success: true,
            message:
              "Rekomendasi AI berhasil di-generate berdasarkan analisis cuaca dan energi.",
            data: {
              id: "1151d41d-535a-402e-8cc0-07457489ee22",
              cycle_id: "c8411d9a-1100-4b24-9b2f-7fc11c87fa1d",
              recommendation_date: "2026-05-05T00:00:00.000Z",
              ai_response: {
                status_lingkungan_dan_kesehatan:
                  "Tanaman sehat, tidak ada laporan penyakit. Namun besok diperkirakan akan hujan lebat dengan probabilitas 85%.",
                rekomendasi_penyiraman: {
                  status: "JANGAN_SIRAM",
                  volume_liter: 0,
                  estimasi_hemat_kwh: 1.5,
                },
                rekomendasi_pemupukan: {
                  status: "JANGAN_PUPUK",
                  alasan:
                    "Hujan lebat berpotensi mencuci pupuk dari polibek sebelum terserap akar.",
                },
                pesan_petani:
                  "Bapak/Ibu Petani, besok diperkirakan hujan turun. Kita istirahatkan pompa air hari ini untuk menghemat listrik sekitar 1.5 kWh!",
              },
              context_used: {
                riwayat_aktivitas: "Belum ada aktivitas tercatat.",
                status_kesehatan: "Tanaman sehat, tidak ada laporan penyakit.",
                rekomendasi_kemarin: "Belum ada rekomendasi (Ini hari pertama)",
                cuaca_besok: {
                  temp: 28.5,
                  humidity: 80,
                  condition: "hujan lebat",
                  rain_probability: 85,
                  wind_speed: 3.2,
                },
              },
              created_at: "2026-05-05T10:47:33.000Z",
            },
          },
        },
      },
    },
    400: {
      description:
        "Format cycleId tidak valid atau Lokasi lahan belum diset kordinatnya",
    },
    404: {
      description: "Siklus tanam (Planting Cycle) tidak ditemukan",
    },
    500: {
      description:
        "Gagal memproses rekomendasi AI (Limit tercapai/Error Google) atau Database Error",
    },
  },
});
