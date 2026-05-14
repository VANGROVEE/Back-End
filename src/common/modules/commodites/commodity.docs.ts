import { registry } from "@/common/docs/openapi-registry";
import { commonSchema } from "@/common/utils/schema";
import { createCommoditySchema, updateCommoditySchema } from "./comodity.dto";

registry.registerPath({
  method: "get",
  path: "/commodities",
  tags: ["Commodity"],
  summary: "Mengambil semua data komoditas",
  description:
    "Menampilkan daftar seluruh tanaman/komoditas yang didukung oleh sistem Vangrove beserta status dukungan AI-nya.",
  responses: {
    200: {
      description: "Berhasil mengambil daftar komoditas",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Daftar komoditas berhasil diambil",
              },
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/CreateCommodityBody" },
              },
            },
          },
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
  description:
    "Mengambil informasi detail komoditas, termasuk slug AI dan status dukungan fitur AI berdasarkan ID.",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: { description: "Data komoditas ditemukan" },
    404: { description: "Komoditas tidak ditemukan" },
  },
});

registry.registerPath({
  method: "post",
  path: "/commodities",
  tags: ["Commodity"],
  summary: "Menambahkan komoditas baru",
  description:
    "Menambahkan jenis tanaman baru ke dalam sistem master data Vangrove.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCommoditySchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: { description: "Komoditas berhasil ditambahkan" },
    400: { description: "Input data tidak valid" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/commodities/{id}",
  tags: ["Commodity"],
  summary: "Memperbarui data komoditas",
  description:
    "Mengubah informasi komoditas seperti nama, slug AI, atau mengaktifkan/menonaktifkan dukungan fitur AI.",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": {
          schema: updateCommoditySchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: "Komoditas berhasil diperbarui" },
    400: { description: "Input data tidak valid" },
    404: { description: "Komoditas tidak ditemukan" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/commodities/{id}",
  tags: ["Commodity"],
  summary: "Menghapus data komoditas",
  description: "Menghapus data komoditas dari sistem master data.",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: { description: "Komoditas berhasil dihapus" },
    404: { description: "Komoditas tidak ditemukan" },
  },
});


registry.registerPath({
  method: "post",
  path: "/commodities/import",
  tags: ["Commodity"],
  summary: "Import Komoditas via Excel",
  description:
    "Mengunggah file Excel (.xlsx) untuk menambahkan banyak data komoditas sekaligus.",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                format: "binary",
                description: "File Excel komoditas",
              },
            },
            required: ["file"],
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Data berhasil diimport",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "15 data komoditas berhasil diimport",
              },
            },
          },
        },
      },
    },
    400: { description: "File tidak valid atau format salah" },
  },
});