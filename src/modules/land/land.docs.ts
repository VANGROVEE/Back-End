import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { commonSchema } from "@/common/utils/schema";
import {
  createLandBodySchema,
  adminCreateLandBodySchema,
  updateLandBodySchema,
} from "./land.dto";

const LandResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operasi berhasil" }),
});

const LandDataSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  owner_id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
  name: z.string().openapi({ example: "Kebun Mangrove A" }),
  total_area: z.number().openapi({ example: 1500.5 }),
  location: z.object({
    latitude: z.number().openapi({ example: -1.5925 }),
    longitude: z.number().openapi({ example: 103.614 }),
    address: z.string().openapi({ example: "Jambi, Indonesia" }),
  }),
  is_active: z.boolean().openapi({ example: true }),
  created_at: z.string().datetime(),
});

registry.registerPath({
  method: "get",
  path: "/land",
  tags: ["Land"],
  summary: "Daftar Lahan Milik Pengguna",
  description:
    "Mengambil semua daftar lahan yang dimiliki oleh user yang sedang login.",
  responses: {
    200: {
      description: "Berhasil mengambil data",
      content: {
        "application/json": {
          schema: LandResponseCore.extend({
            data: z.array(LandDataSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/land/admin",
  tags: ["Land"],
  summary: "Daftar Semua Lahan (Admin)",
  description: "Mengambil seluruh data lahan di sistem tanpa filter owner_id.",
  responses: {
    200: {
      description: "Berhasil mengambil data admin",
      content: {
        "application/json": {
          schema: LandResponseCore.extend({
            data: z.array(LandDataSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/land/stats",
  tags: ["Land"],
  summary: "Statistik Lahan",
  responses: {
    200: {
      description: "Statistik berhasil diambil",
      content: {
        "application/json": {
          schema: LandResponseCore.extend({
            data: z.object({
              total_lands: z.number().openapi({ example: 10 }),
              total_area: z.number().openapi({ example: 5000 }),
              active_lands: z.number().openapi({ example: 8 }),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/land/{id}",
  tags: ["Land"],
  summary: "Detail Lahan",
  request: { params: commonSchema.paramsId },
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: LandResponseCore.extend({ data: LandDataSchema }),
        },
      },
    },
    404: { description: "Lahan tidak ditemukan" },
  },
});

registry.registerPath({
  method: "post",
  path: "/land",
  tags: ["Land"],
  summary: "Tambah Lahan Baru",
  request: {
    body: {
      content: { "application/json": { schema: createLandBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Lahan berhasil dibuat",
      content: {
        "application/json": {
          schema: LandResponseCore.extend({ data: LandDataSchema }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/land/admin",
  tags: ["Land"],
  summary: "Tambah Lahan (Admin)",
  description:
    "Menambahkan lahan dengan kemampuan menentukan owner_id secara manual.",
  request: {
    body: {
      content: { "application/json": { schema: adminCreateLandBodySchema } },
    },
  },
  responses: {
    201: { description: "Lahan admin berhasil dibuat" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/land/{id}",
  tags: ["Land"],
  summary: "Update Data Lahan",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: { "application/json": { schema: updateLandBodySchema } },
    },
  },
  responses: {
    200: { description: "Lahan berhasil diperbarui" },
    404: { description: "Lahan tidak ditemukan" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/land/{id}",
  tags: ["Land"],
  summary: "Hapus Lahan",
  request: { params: commonSchema.paramsId },
  responses: {
    200: { description: "Lahan berhasil dihapus" },
  },
});
