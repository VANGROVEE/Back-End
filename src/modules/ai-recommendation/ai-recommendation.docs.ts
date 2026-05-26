import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";


const AiResponseCore = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
});


registry.registerPath({
  method: "get",
  path: "/ai-recommendation/daily-recommendation/{id}",
  tags: ["AI Recommendation"],
  summary: "Generate/Ambil Rekomendasi AI Harian",
  description:
    "Menganalisis cuaca dan riwayat untuk memberikan saran penyiraman harian.",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Berhasil",
      content: { "application/json": { schema: AiResponseCore } },
    },
    404: { description: "Siklus tidak ditemukan" },
  },
});


registry.registerPath({
  method: "get",
  path: "/ai-recommendation/analyze-crop-failure/{id}",
  tags: ["AI Recommendation"],
  summary: "Analisis Kegagalan Panen",
  description: "Investigasi AI terhadap penyebab siklus tanam yang gagal.",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Berhasil",
      content: { "application/json": { schema: AiResponseCore } },
    },
  },
});


registry.registerPath({
  method: "get",
  path: "/ai-recommendation",
  tags: ["AI Recommendation"],
  summary: "Ambil Riwayat Rekomendasi",
  description: "Mendapatkan semua log AI berdasarkan cycle_id di query.",
  request: {
    query: z.object({
      cycle_id: z.string().uuid(),
      type: z.enum(["DAILY", "FAILURE_ANALYSIS"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Berhasil",
      content: { "application/json": { schema: AiResponseCore } },
    },
  },
});
