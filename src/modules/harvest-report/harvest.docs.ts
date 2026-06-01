import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { commonSchema } from "@/common/utils/schema";
import { createHarvestReportBodySchema } from "./harvest.dto";

const HarvestResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operasi berhasil" }),
});

const HarvestReportDataSchema = z.object({
  id: z.string().uuid(),
  cycle_id: z.string().uuid(),
  total_yield_kg: z.number().openapi({ example: 1250.5 }),
  quality_grade: z.string().openapi({ example: "A" }),
  price_sold_per_kg: z.number().openapi({ example: 15000 }),
  revenue: z.number().openapi({ example: 18757500 }),
  created_at: z.string().datetime(),
});

/** 1. Endpoint: Harvest Dashboard */
registry.registerPath({
  method: "get",
  path: "/harvest-report/dashboard",
  tags: ["Harvest Report"],
  summary: "Data Dashboard Panen",
  description:
    "Mengambil ringkasan performa panen, total pendapatan, dan rata-rata kualitas hasil produksi.",
  responses: {
    200: {
      description: "Data dashboard ditemukan",
      content: {
        "application/json": {
          schema: HarvestResponseCore.extend({
            data: z.object({
              total_revenue: z.number().openapi({ example: 50000000 }),
              total_yield: z.number().openapi({ example: 3500 }),
              avg_price: z.number().openapi({ example: 14500 }),
              monthly_stats: z.array(
                z.object({
                  month: z.string(),
                  yield: z.number(),
                  revenue: z.number(),
                }),
              ),
            }),
          }),
        },
      },
    },
  },
});

/** 2. Endpoint: Get By ID */
registry.registerPath({
  method: "get",
  path: "/harvest-report/{id}",
  tags: ["Harvest Report"],
  summary: "Detail Laporan Panen",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Laporan ditemukan",
      content: {
        "application/json": {
          schema: HarvestResponseCore.extend({
            data: HarvestReportDataSchema.extend({
              ai_quality_metrics: z.any().openapi({
                example: { defects: 4, uniformity: 89, ripeness: 92 },
              }),
              image_proof_url: z.string().url().nullable(),
            }),
          }),
        },
      },
    },
    404: { description: "Laporan panen tidak ditemukan" },
  },
});

/** 3. Endpoint: Create Harvest Report */
registry.registerPath({
  method: "post",
  path: "/harvest-report",
  tags: ["Harvest Report"],
  summary: "Buat Laporan Panen Baru",
  description:
    "Mencatat hasil panen dari suatu siklus tanam. Tindakan ini biasanya akan mengubah status siklus menjadi HARVESTED.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createHarvestReportBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Laporan berhasil dibuat",
      content: {
        "application/json": {
          schema: HarvestResponseCore.extend({
            data: HarvestReportDataSchema,
          }),
        },
      },
    },
    400: {
      description: "Input tidak valid atau siklus sudah memiliki laporan panen",
    },
  },
});
