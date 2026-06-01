import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { spatialAnalysisResponseSchema } from "./dashboard-analyze.dto";

const AnalyzeResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z
    .string()
    .openapi({ example: "Analisis dashboard berhasil dimuat" }),
});

/** 1. Endpoint: Spatial Analysis */
registry.registerPath({
  method: "get",
  path: "/analyze/spatial",
  tags: ["Dashboard Analytics"],
  summary: "Analisis Spasial & Geografis Lahan",
  description:
    "Mengambil data koordinat lahan, status kelembapan tanah, dan cuaca real-time untuk visualisasi map.",
  responses: {
    200: {
      description: "Data spasial ditemukan",
      content: {
        "application/json": {
          schema: AnalyzeResponseCore.extend({
            data: spatialAnalysisResponseSchema,
          }),
        },
      },
    },
  },
});

/** 2. Endpoint: Health Reports */
registry.registerPath({
  method: "get",
  path: "/analyze/health-reports",
  tags: ["Dashboard Analytics"],
  summary: "Ringkasan Kesehatan Tanaman",
  description:
    "Statistik kesehatan tanaman berdasarkan laporan terbaru dari AI ML Model.",
  responses: {
    200: {
      description: "Berhasil",
      content: {
        "application/json": {
          schema: AnalyzeResponseCore.extend({
            data: z.object({
              total_scanned: z.number().openapi({ example: 150 }),
              healthy_count: z.number().openapi({ example: 130 }),
              disease_detected: z.number().openapi({ example: 20 }),
            }),
          }),
        },
      },
    },
  },
});

/** 3. Endpoint: Planting Trend */
registry.registerPath({
  method: "get",
  path: "/analyze/planting-trend",
  tags: ["Dashboard Analytics"],
  summary: "Tren Penanaman",
  description:
    "Data deret waktu (time-series) mengenai jumlah penanaman baru setiap bulan.",
  responses: {
    200: {
      description: "Berhasil",
      content: {
        "application/json": {
          schema: AnalyzeResponseCore.extend({
            data: z.array(
              z.object({
                month: z.string().openapi({ example: "Mei 2026" }),
                count: z.number().openapi({ example: 45 }),
              }),
            ),
          }),
        },
      },
    },
  },
});

/** 4. Endpoint: Disease Reports (Trend) */
registry.registerPath({
  method: "get",
  path: "/analyze/diase-reports",
  tags: ["Dashboard Analytics"],
  summary: "Tren Wabah Penyakit",
  description:
    "Mengidentifikasi jenis penyakit yang paling sering muncul dan frekuensinya.",
  responses: {
    200: {
      description: "Berhasil",
      content: {
        "application/json": {
          schema: AnalyzeResponseCore.extend({
            data: z.array(
              z.object({
                disease_name: z.string().openapi({ example: "Bercak Daun" }),
                frequency: z.number().openapi({ example: 12 }),
                severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
              }),
            ),
          }),
        },
      },
    },
  },
});

/** 5. Endpoint: Recommendations Reports */
registry.registerPath({
  method: "get",
  path: "/analyze/recommendations-reports",
  tags: ["Dashboard Analytics"],
  summary: "Rekomendasi Aktif",
  description:
    "Daftar saran tindakan AI yang paling mendesak untuk segera dilakukan petani.",
  responses: {
    200: {
      description: "Berhasil",
      content: {
        "application/json": {
          schema: AnalyzeResponseCore.extend({
            data: z.array(
              z.object({
                land_name: z.string(),
                action: z.string().openapi({ example: "Penyiraman Intensif" }),
                priority: z.enum(["URGENT", "NORMAL"]),
              }),
            ),
          }),
        },
      },
    },
  },
});
