import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { commonSchema } from "@/common/utils/schema";
import {
  healthReportSchema,
  updateHealthReportSchema,
  healthReportQuerySchema,
} from "./health.dto";

const HealthResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operasi berhasil" }),
});

const HealthReportDataSchema = healthReportSchema.extend({
  id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  created_at: z.string().datetime(),
  disease: z
    .object({
      name: z.string().openapi({ example: "Leaf Rust" }),
      scientific_name: z.string().nullable(),
    })
    .nullable(),
});

registry.registerPath({
  method: "get",
  path: "/health-report",
  tags: ["Health Report"],
  summary: "Daftar Laporan Kesehatan",
  description:
    "Mengambil semua riwayat observasi kesehatan tanaman, dapat difilter berdasarkan cycle_id.",
  request: {
    query: healthReportQuerySchema,
  },
  responses: {
    200: {
      description: "Daftar laporan ditemukan",
      content: {
        "application/json": {
          schema: HealthResponseCore.extend({
            data: z.array(HealthReportDataSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/health-report/{id}",
  tags: ["Health Report"],
  summary: "Detail Laporan Kesehatan",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: HealthResponseCore.extend({
            data: HealthReportDataSchema,
          }),
        },
      },
    },
    404: { description: "Laporan tidak ditemukan" },
  },
});

registry.registerPath({
  method: "post",
  path: "/health-report",
  tags: ["Health Report"],
  summary: "Simpan Laporan Kesehatan Baru",
  description:
    "Mencatat hasil observasi penyakit, skor kepercayaan AI, dan wawasan dari Gemini.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: healthReportSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Laporan berhasil dibuat",
      content: {
        "application/json": {
          schema: HealthResponseCore.extend({
            data: HealthReportDataSchema,
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/health-report/{id}",
  tags: ["Health Report"],
  summary: "Perbarui Laporan Kesehatan",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": {
          schema: updateHealthReportSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Berhasil diperbarui",
      content: {
        "application/json": {
          schema: HealthResponseCore,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/health-report/{id}",
  tags: ["Health Report"],
  summary: "Hapus Laporan Kesehatan",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Berhasil dihapus",
      content: {
        "application/json": {
          schema: HealthResponseCore,
        },
      },
    },
  },
});
