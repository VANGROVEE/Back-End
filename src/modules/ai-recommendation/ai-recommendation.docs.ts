import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";

const AiResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Data berhasil diambil" }),
});

const DailyAiData = z.object({
  status_lingkungan_dan_kesehatan: z.string().openapi({
    example:
      "Suhu optimal 28°C, kelembapan tanah rendah (40%). Tanaman terdeteksi sehat.",
  }),
  rekomendasi_penyiraman: z.object({
    status: z
      .enum(["PERLU", "TIDAK_PERLU", "PENTING"])
      .openapi({ example: "PERLU" }),
    volume_liter: z.number().openapi({ example: 12.5 }),
    estimasi_hemat_kwh: z.number().openapi({ example: 0.35 }),
  }),
  rekomendasi_pemupukan: z.object({
    status: z.string().openapi({ example: "Tunda" }),
    alasan: z
      .string()
      .openapi({ example: "Baru saja dilakukan pemupukan 2 hari yang lalu." }),
  }),
  pesan_petani: z.string().openapi({
    example:
      "Pastikan saluran air lancar karena ada potensi hujan ringan besok malam.",
  }),
});

const FailureAiData = z.object({
  analisis_kegagalan: z.string().openapi({
    example:
      "Kematian bibit disebabkan oleh salinitas air yang terlalu tinggi (Outbreak Trigger).",
  }),
  faktor_dominan: z
    .enum(["ENVIRONMENT", "PEST", "HUMAN_ERROR", "DATA_MISSING"])
    .openapi({ example: "ENVIRONMENT" }),
  skor_kelalaian_manusia: z.number().min(0).max(100).openapi({ example: 20 }),
  rekomendasi_perbaikan_masa_depan: z.array(z.string()).openapi({
    example: ["Gunakan filter air", "Pilih varietas yang lebih tahan garam"],
  }),
});

registry.registerPath({
  method: "get",
  path: "/ai-recommendation/daily-recommendation/{id}",
  tags: ["AI Recommendation"],
  summary: "Generate/Ambil Rekomendasi AI Harian",
  description:
    "Mengambil context (cuaca, tanah, riwayat) dan menghasilkan saran perawatan menggunakan LLM Gemini.",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Rekomendasi Berhasil Dihasilkan",
      content: {
        "application/json": {
          schema: AiResponseCore.extend({
            data: DailyAiData,
          }),
        },
      },
    },
    404: { description: "Siklus tanam tidak ditemukan" },
    400: { description: "Lokasi lahan belum diatur (koordinat kosong)" },
  },
});

registry.registerPath({
  method: "get",
  path: "/ai-recommendation/analyze-crop-failure/{id}",
  tags: ["AI Recommendation"],
  summary: "Analisis Kegagalan Panen",
  description:
    "Investigasi mendalam terhadap riwayat aktivitas dan laporan kesehatan pada siklus yang berstatus FAILED.",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Analisis Kegagalan Berhasil",
      content: {
        "application/json": {
          schema: AiResponseCore.extend({
            data: FailureAiData,
          }),
        },
      },
    },
    404: { description: "Siklus gagal tidak ditemukan" },
  },
});

registry.registerPath({
  method: "get",
  path: "/ai-recommendation",
  tags: ["AI Recommendation"],
  summary: "Ambil Riwayat Rekomendasi",
  description:
    "Mendapatkan daftar log AI (Daily/Failure) berdasarkan cycle_id.",
  request: {
    query: z.object({
      cycle_id: z.string().uuid(),
      type: z.enum(["DAILY", "FAILURE_ANALYSIS"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Riwayat ditemukan",
      content: {
        "application/json": {
          schema: AiResponseCore.extend({
            data: z.array(
              z.object({
                id: z.string().uuid(),
                type: z.string(),
                recommendation_date: z.string(),
                ai_response: z.any(),
              }),
            ),
          }),
        },
      },
    },
  },
});
