import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { commonSchema } from "@/common/utils/schema";
import {
  createDailyActivitySchema,
  getDailyActivitiesQuerySchema,
  updateDailyActivitySchema,
} from "./daily-activity.dto";

const DailyActivityResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operasi berhasil" }),
});

const DailyActivityDataSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  cycle_id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  activity_type: z
    .enum([
      "PLANTING",
      "WATERING",
      "FERTILIZING",
      "PEST_CONTROL",
      "MAINTENANCE",
      "OBSERVATION",
      "HARVESTING",
      "OTHER",
    ])
    .openapi({ example: "WATERING" }),
  amount: z.number().nullable().openapi({ example: 10.5 }),
  unit: z.string().nullable().openapi({ example: "Liter" }),
  notes: z
    .string()
    .nullable()
    .openapi({ example: "Penyiraman rutin pagi hari" }),
  weather_data: z
    .object({
      condition: z.string().openapi({ example: "Cerah Berawan" }),
      temperature: z.number().openapi({ example: 30 }),
      humidity: z.number().openapi({ example: 65 }),
    })
    .nullable(),
  activity_date: z.string().openapi({ example: "2026-06-01" }),
  created_at: z.string().datetime(),
});

registry.registerPath({
  method: "get",
  path: "/daily-activities",
  tags: ["Daily Activities"],
  summary: "Ambil Riwayat Aktivitas Harian",
  description:
    "Mendapatkan daftar aktivitas harian berdasarkan filter cycle_id.",
  request: {
    query: getDailyActivitiesQuerySchema.shape.query,
  },
  responses: {
    200: {
      description: "Berhasil mengambil data",
      content: {
        "application/json": {
          schema: DailyActivityResponseCore.extend({
            data: z.array(DailyActivityDataSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/daily-activities/{id}",
  tags: ["Daily Activities"],
  summary: "Detail Aktivitas Harian",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: DailyActivityResponseCore.extend({
            data: DailyActivityDataSchema,
          }),
        },
      },
    },
    404: { description: "Aktivitas tidak ditemukan" },
  },
});

registry.registerPath({
  method: "post",
  path: "/daily-activities",
  tags: ["Daily Activities"],
  summary: "Catat Aktivitas Baru",
  description:
    "Mencatat aktivitas seperti penyiraman, pemupukan, atau observasi ke dalam siklus tanam.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createDailyActivitySchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Aktivitas berhasil dicatat",
      content: {
        "application/json": {
          schema: DailyActivityResponseCore.extend({
            data: DailyActivityDataSchema,
          }),
        },
      },
    },
    400: {
      description:
        "Input tidak valid atau duplikasi data pada tanggal yang sama",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/daily-activities/{id}",
  tags: ["Daily Activities"],
  summary: "Perbarui Catatan Aktivitas",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": {
          schema: updateDailyActivitySchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Catatan berhasil diperbarui",
      content: {
        "application/json": {
          schema: DailyActivityResponseCore,
        },
      },
    },
    404: { description: "Aktivitas tidak ditemukan" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/daily-activities/{id}",
  tags: ["Daily Activities"],
  summary: "Hapus Catatan Aktivitas",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Aktivitas berhasil dihapus",
      content: {
        "application/json": {
          schema: DailyActivityResponseCore,
        },
      },
    },
    404: { description: "Aktivitas tidak ditemukan" },
  },
});
