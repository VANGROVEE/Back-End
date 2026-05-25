import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { notificationResponseSchema } from "./notification.dto";

const tags = ["Notifications"];

registry.registerPath({
  method: "get",
  path: "/notifications",
  summary: "Ambil Semua Notifikasi",
  description:
    "Mengambil daftar seluruh notifikasi milik user yang sedang login, diurutkan dari yang terbaru.",
  tags,
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "Daftar notifikasi berhasil diambil",
      content: {
        "application/json": {
          schema: z.array(notificationResponseSchema),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/notifications/unread-count",
  summary: "Jumlah Notifikasi Belum Dibaca",
  description:
    "Mendapatkan angka total notifikasi yang memiliki status is_read = false untuk keperluan badge icon.",
  tags,
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "Berhasil menghitung jumlah unread",
      content: {
        "application/json": {
          schema: z.object({
            count: z.number().openapi({ example: 5 }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/read-all",
  summary: "Tandai Semua Telah Dibaca",
  description:
    "Mengubah status seluruh notifikasi milik user menjadi dibaca (is_read: true) secara massal.",
  tags,
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: "Semua notifikasi berhasil diperbarui" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/{id}/read",
  summary: "Tandai Satu Notifikasi Dibaca",
  description:
    "Mengubah status satu notifikasi spesifik menjadi dibaca berdasarkan ID.",
  tags,
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Notifikasi berhasil diperbarui",
      content: { "application/json": { schema: notificationResponseSchema } },
    },
    404: { description: "Notifikasi tidak ditemukan" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/notifications/all",
  summary: "Bersihkan Kotak Masuk",
  description:
    "Menghapus seluruh riwayat notifikasi milik user tanpa terkecuali.",
  tags,
  security: [{ BearerAuth: [] }],
  responses: {
    200: { description: "Seluruh notifikasi berhasil dihapic" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/notifications/{id}",
  summary: "Hapus Notifikasi",
  description: "Menghapus satu pesan notifikasi spesifik berdasarkan ID.",
  tags,
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { description: "Notifikasi berhasil dihapus" },
    404: { description: "Notifikasi tidak ditemukan" },
  },
});
