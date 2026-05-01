import { registry } from "@/common/docs/openapi-registry";
import { commonSchema } from "@/common/utils/schema";
import { createDailyActivityBodySchema, updateDailyActivityBodySchema } from "../daily-activity/daily-activity.dto";


registry.registerPath({
  method: "post",
  path: "/daily-activities",
  tags: ["Daily Activity"],
  summary: "Catat Aktivitas Harian Baru",
  description:
    "Mencatat aktivitas harian baru (seperti penyiraman, pemupukan) untuk siklus tanam yang sedang aktif di sistem Vangrove. Mendukung pencatatan data cuaca (weather_data).",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createDailyActivityBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Aktivitas harian berhasil dicatat",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Aktivitas harian berhasil dicatat",
              },
              data: { $ref: "#/components/schemas/CreateDailyActivityDto" },
            },
          },
        },
      },
    },
    400: { description: "Validasi data gagal atau siklus tidak aktif" },
    401: { description: "Unauthorized - Token diperlukan" },
    404: { description: "Siklus tanam tidak ditemukan" },
  },
});

registry.registerPath({
  method: "get",
  path: "/daily-activities",
  tags: ["Daily Activity"],
  summary: "Mengambil semua aktivitas harian",
  description:
    "Menampilkan daftar seluruh catatan aktivitas harian. Dapat di-filter berdasarkan parameter tertentu (jika diimplementasikan).",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Berhasil mengambil daftar aktivitas harian",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Daftar aktivitas harian berhasil diambil",
              },
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/CreateDailyActivityDto" },
              },
            },
          },
        },
      },
    },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "get",
  path: "/daily-activities/{id}",
  tags: ["Daily Activity"],
  summary: "Detail Aktivitas Harian",
  description:
    "Mendapatkan informasi detail mengenai satu catatan aktivitas harian.",
  security: [{ bearerAuth: [] }],
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Data ditemukan",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Detail aktivitas harian ditemukan",
              },
              data: { $ref: "#/components/schemas/CreateDailyActivityDto" },
            },
          },
        },
      },
    },
    404: { description: "Aktivitas harian tidak ditemukan" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/daily-activities/{id}",
  tags: ["Daily Activity"],
  summary: "Update Aktivitas Harian",
  description:
    "Memperbarui data aktivitas harian yang sudah ada. Hanya field yang dikirim yang akan diubah (partial update).",
  security: [{ bearerAuth: [] }],
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": {
          schema: updateDailyActivityBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Aktivitas harian berhasil diperbarui",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Aktivitas harian berhasil diperbarui",
              },
              data: { $ref: "#/components/schemas/UpdateDailyActivityDto" },
            },
          },
        },
      },
    },
    400: { description: "Validasi data gagal" },
    404: { description: "Aktivitas harian tidak ditemukan" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/daily-activities/{id}",
  tags: ["Daily Activity"],
  summary: "Hapus Aktivitas Harian",
  description: "Menghapus catatan aktivitas harian dari database.",
  security: [{ bearerAuth: [] }],
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Aktivitas harian berhasil dihapus",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Aktivitas harian berhasil dihapus",
              },
            },
          },
        },
      },
    },
    404: { description: "Aktivitas harian tidak ditemukan" },
  },
});
