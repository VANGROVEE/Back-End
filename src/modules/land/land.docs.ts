import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { createLandBodySchema, updateLandBodySchema } from "./land.dto";

const landResponseSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    total_area: z.number(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
    }),
    owner_id: z.string(),
    createdAt: z.date(),
  })
  .openapi("LandResponse");

registry.registerPath({
  method: "post",
  path: "/lands",
  summary: "Tambah Lahan Baru",
  description:
    "Memasukkan data lahan baru ke dalam sistem Vangrove. Field 'location' dan 'total_area' wajib diisi dengan angka.",
  tags: ["Lands"],
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createLandBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Lahan berhasil dibuat",
      content: { "application/json": { schema: landResponseSchema } },
    },
    400: { description: "Validasi input gagal (strict mode aktif)" },
  },
});

registry.registerPath({
  method: "get",
  path: "/lands",
  summary: "Ambil Semua Lahan",
  description:
    "Mengambil daftar seluruh lahan yang dimiliki oleh user yang sedang terautentikasi.",
  tags: ["Lands"],
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "Daftar lahan berhasil diambil",
      content: {
        "application/json": {
          schema: z.array(landResponseSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/lands/{id}",
  summary: "Update Data Lahan",
  description:
    "Memperbarui informasi lahan secara parsial. Hanya field yang dikirim yang akan berubah.",
  tags: ["Lands"],
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: {
        "application/json": { schema: updateLandBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Lahan berhasil diperbarui",
      content: { "application/json": { schema: landResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/lands/{id}",
  summary: "Hapus Lahan",
  description:
    "Menghapus data lahan dari sistem secara permanen berdasarkan ID.",
  tags: ["Lands"],
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { description: "Lahan berhasil dihapus" },
    404: { description: "Lahan tidak ditemukan" },
  },
});
