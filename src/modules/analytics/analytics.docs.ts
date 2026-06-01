import { registry } from "@/common/docs/openapi-registry";
import { authenticate } from "@/common/middlewares/auth";
import { z } from "zod";

/** Reusable Schemas */
const AnalyticsResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Data statistik berhasil diambil" }),
});

/** 1. Endpoint: Users Active Analytics */
registry.registerPath({
  method: "get",
  path: "/analytics/users-active",
  tags: ["Analytics"],
  summary: "Statistik Pengguna Aktif",
  description:
    "Mengambil total petani (FARMER) dan persentase pertumbuhan dibandingkan bulan lalu.",
  security: [{ [authenticate.name]: [] }],
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: AnalyticsResponseCore.extend({
            data: z.object({
              value: z.string().openapi({ example: "1,250" }),
              label: z.string().openapi({ example: "PENGGUNA AKTIF" }),
              increase: z.string().openapi({ example: "+15%" }),
            }),
          }),
        },
      },
    },
    401: { description: "Unauthorized - Token tidak valid" },
  },
});

/** 2. Endpoint: AI Performance Analytics */
registry.registerPath({
  method: "get",
  path: "/analytics/ai-performance",
  tags: ["Analytics"],
  summary: "Statistik Performa AI",
  description:
    "Mengambil total log rekomendasi yang dihasilkan AI dan status sistem saat ini.",
  security: [{ [authenticate.name]: [] }],
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: AnalyticsResponseCore.extend({
            data: z.object({
              value: z.string().openapi({ example: "8,432" }),
              label: z.string().openapi({ example: "TOTAL REKOMENDASI AI" }),
              status: z.string().openapi({ example: "99.9% Online" }),
            }),
          }),
        },
      },
    },
    401: { description: "Unauthorized - Token tidak valid" },
  },
});
