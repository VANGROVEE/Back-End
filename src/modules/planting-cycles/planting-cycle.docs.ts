import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { commonSchema } from "@/common/utils/schema";
import {
  createPlantingCycleBodySchema,
  updatePlantingCycleBodySchema,
  getPlantingCycleQuerySchema,
} from "./planting-cycle.dto";

const PlantingCycleResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operasi berhasil" }),
});

const PlantingCycleDataSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  land_id: z.string().uuid(),
  commodity_id: z.string().uuid(),
  variety: z.string().nullable(),
  planting_method: z.string().nullable(),
  start_date: z.string().datetime(),
  estimated_harvest: z.string().datetime().nullable(),
  status: z.enum(["PLANTING", "HARVESTED", "COMPLETED", "FAILED"]),
  created_at: z.string().datetime(),
  commodity: z
    .object({
      name: z.string().openapi({ example: "Mangrove Rhizophora" }),
    })
    .optional(),
});

registry.registerPath({
  method: "get",
  path: "/planting-cycle",
  tags: ["Planting Cycle"],
  summary: "Ambil Semua Siklus Tanam",
  description:
    "Mendapatkan daftar siklus tanam dengan filter land_id atau status.",
  request: {
    query: getPlantingCycleQuerySchema,
  },
  responses: {
    200: {
      description: "Daftar siklus ditemukan",
      content: {
        "application/json": {
          schema: PlantingCycleResponseCore.extend({
            data: z.array(PlantingCycleDataSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/planting-cycle/heatmap-calendar",
  tags: ["Planting Cycle"],
  summary: "Data Kalender Heatmap Aktivitas",
  description:
    "Mendapatkan intensitas aktivitas harian dalam siklus tanam untuk visualisasi heatmap.",
  request: {
    query: getPlantingCycleQuerySchema,
  },
  responses: {
    200: {
      description: "Data heatmap berhasil diambil",
      content: {
        "application/json": {
          schema: PlantingCycleResponseCore.extend({
            data: z.array(
              z.object({
                date: z.string().openapi({ example: "2026-05-20" }),
                count: z.number().openapi({ example: 5 }),
              }),
            ),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/planting-cycle/cycle-summary",
  tags: ["Planting Cycle"],
  summary: "Ringkasan Statistik Siklus",
  description:
    "Mendapatkan data agregat seperti durasi tanam dan jumlah aktivitas.",
  request: {
    query: getPlantingCycleQuerySchema,
  },
  responses: {
    200: {
      description: "Data summary ditemukan",
      content: {
        "application/json": {
          schema: PlantingCycleResponseCore.extend({
            data: z.object({
              total_days: z.number().openapi({ example: 45 }),
              activity_count: z.number().openapi({ example: 120 }),
              health_status: z.string().openapi({ example: "Optimal" }),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/planting-cycle/{id}",
  tags: ["Planting Cycle"],
  summary: "Detail Siklus Tanam",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: PlantingCycleResponseCore.extend({
            data: PlantingCycleDataSchema,
          }),
        },
      },
    },
    404: { description: "Siklus tidak ditemukan" },
  },
});

registry.registerPath({
  method: "post",
  path: "/planting-cycle",
  tags: ["Planting Cycle"],
  summary: "Mulai Siklus Tanam Baru",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPlantingCycleBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Siklus berhasil dibuat",
      content: {
        "application/json": {
          schema: PlantingCycleResponseCore.extend({
            data: PlantingCycleDataSchema,
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/planting-cycle/{id}",
  tags: ["Planting Cycle"],
  summary: "Perbarui Data Siklus",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": {
          schema: updatePlantingCycleBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Siklus berhasil diperbarui",
      content: {
        "application/json": {
          schema: PlantingCycleResponseCore,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/planting-cycle/{id}",
  tags: ["Planting Cycle"],
  summary: "Hapus Siklus Tanam",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Siklus berhasil dihapus",
      content: {
        "application/json": {
          schema: PlantingCycleResponseCore,
        },
      },
    },
  },
});
