import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { commonSchema } from "@/common/utils/schema";
import { createCommoditySchema, updateCommoditySchema } from "./comodity.dto";

const CommodityResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operasi berhasil" }),
});

const CommodityDataSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  name: z.string().openapi({ example: "Padi Ciherang" }),
  slug_ai: z.string().openapi({ example: "rice-paddy" }),
  is_ai_supported: z.boolean().openapi({ example: true }),
  category: z.string().openapi({ example: "PANGAN" }),
});

registry.registerPath({
  method: "get",
  path: "/commodities",
  tags: ["Commodity"],
  summary: "Mengambil semua data komoditas",
  description:
    "Menampilkan daftar seluruh tanaman yang didukung sistem Vangrove.",
  responses: {
    200: {
      description: "Daftar komoditas ditemukan",
      content: {
        "application/json": {
          schema: CommodityResponseCore.extend({
            data: z.array(CommodityDataSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/commodities/stats",
  tags: ["Commodity"],
  summary: "Statistik Komoditas",
  description:
    "Mendapatkan ringkasan statistik komoditas, seperti total komoditas dan jumlah yang didukung AI.",
  responses: {
    200: {
      description: "Statistik berhasil diambil",
      content: {
        "application/json": {
          schema: CommodityResponseCore.extend({
            data: z.object({
              total: z.number().openapi({ example: 45 }),
              ai_supported: z.number().openapi({ example: 12 }),
              categories: z
                .number()
                .openapi({ example: { PANGAN: 10, MANGROVE: 5 } }),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/commodities/{id}",
  tags: ["Commodity"],
  summary: "Mendapatkan detail satu komoditas",
  request: { params: commonSchema.paramsId },
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: CommodityResponseCore.extend({ data: CommodityDataSchema }),
        },
      },
    },
    404: { description: "Komoditas tidak ditemukan" },
  },
});

registry.registerPath({
  method: "post",
  path: "/commodities",
  tags: ["Commodity"],
  summary: "Menambahkan komoditas baru",
  request: {
    body: {
      content: {
        "application/json": { schema: createCommoditySchema.shape.body },
      },
    },
  },
  responses: {
    201: { description: "Komoditas berhasil ditambahkan" },
    400: { description: "Input tidak valid" },
  },
});

registry.registerPath({
  method: "post",
  path: "/commodities/import",
  tags: ["Commodity"],
  summary: "Import via Excel",
  description: "Unggah file .xlsx untuk mass-insert data komoditas.",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.string().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Import berhasil",
      content: {
        "application/json": {
          schema: CommodityResponseCore,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/commodities/{id}",
  tags: ["Commodity"],
  summary: "Update komoditas",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": { schema: updateCommoditySchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "Berhasil diperbarui" },
    404: { description: "Data tidak ditemukan" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/commodities/{id}",
  tags: ["Commodity"],
  summary: "Hapus komoditas",
  request: { params: commonSchema.paramsId },
  responses: {
    200: { description: "Berhasil dihapus" },
  },
});
