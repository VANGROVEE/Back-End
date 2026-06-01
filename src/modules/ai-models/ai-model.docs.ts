import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";

/** Reusable Schemas */
const MLResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Analisis berhasil diselesaikan" }),
});

// Detail Payload untuk Prediksi Penyakit
const DiseasePredictionResult = z.object({
  label: z.string().openapi({ example: "Cercospora Leaf Spot" }),
  confidence: z.number().openapi({ example: 0.98 }),
  insight: z
    .object({
      penjelasan: z
        .string()
        .openapi({ example: "Tanaman terdeteksi terkena bercak daun." }),
      tindakan_segera: z
        .array(z.string())
        .openapi({ example: ["Pisahkan tanaman", "Kurangi kelembapan"] }),
      obat_rekomendasi: z
        .string()
        .openapi({ example: "Fungisida berbahan aktif tembaga" }),
    })
    .optional(),
});

/** 1. Endpoint: Predict Only (Tanpa Simpan) */
registry.registerPath({
  method: "post",
  path: "/ml-model/predict-only",
  tags: ["ML Model"],
  summary: "Prediksi Penyakit Tanaman (Cek Saja)",
  description:
    "Menganalisis gambar tanaman untuk mendeteksi penyakit tanpa menyimpan hasil ke database. Cocok untuk fitur 'Preview'.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            image_url: z.string().url().openapi({
              example: "https://storage.vangrove.com/temp/leaf.jpg",
            }),
            commodity_slug: z
              .string()
              .openapi({ example: "mangrove-rhizophora" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Hasil Analisis",
      content: {
        "application/json": {
          schema: MLResponseCore.extend({
            data: DiseasePredictionResult,
          }),
        },
      },
    },
    400: { description: "Gambar tidak valid atau komoditas tidak didukung" },
  },
});

/** 2. Endpoint: Report (Simpan ke Health Report) */
registry.registerPath({
  method: "post",
  path: "/ml-model/report",
  tags: ["ML Model"],
  summary: "Simpan Laporan Kesehatan Tanaman",
  description:
    "Menganalisis gambar, mendeteksi penyakit, dan menyimpannya sebagai HealthReport ke dalam siklus tanam tertentu.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            cycle_id: z
              .string()
              .uuid()
              .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
            image_url: z.string().url().openapi({
              example: "https://storage.vangrove.com/reports/leaf-sick.jpg",
            }),
            notes: z
              .string()
              .optional()
              .openapi({ example: "Ditemukan di blok B bagian selatan" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Laporan Berhasil Disimpan",
      content: {
        "application/json": {
          schema: MLResponseCore.extend({
            data: z.object({
              report_id: z.string().uuid(),
              analysis: DiseasePredictionResult,
              is_outbreak_trigger: z.boolean().openapi({
                description: "True jika penyakit berbahaya & menular",
              }),
            }),
          }),
        },
      },
    },
    404: { description: "Siklus tanam tidak ditemukan" },
  },
});
