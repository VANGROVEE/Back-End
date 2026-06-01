import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { commonSchema } from "@/common/utils/schema";
import { notificationResponseSchema } from "./notification.dto";

const NotificationResponseCore = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Operasi berhasil" }),
});

registry.registerPath({
  method: "get",
  path: "/notifications",
  tags: ["Notifications"],
  summary: "Ambil Semua Notifikasi",
  description:
    "Mendapatkan daftar notifikasi untuk pengguna yang sedang login.",
  responses: {
    200: {
      description: "Daftar notifikasi ditemukan",
      content: {
        "application/json": {
          schema: NotificationResponseCore.extend({
            data: z.array(notificationResponseSchema),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/notifications/unread-count",
  tags: ["Notifications"],
  summary: "Jumlah Notifikasi Belum Dibaca",
  responses: {
    200: {
      description: "Berhasil mengambil jumlah unread",
      content: {
        "application/json": {
          schema: NotificationResponseCore.extend({
            data: z.object({
              count: z.number().openapi({ example: 5 }),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/read-all",
  tags: ["Notifications"],
  summary: "Tandai Semua Sudah Dibaca",
  responses: {
    200: {
      description: "Semua notifikasi berhasil diperbarui",
      content: {
        "application/json": {
          schema: NotificationResponseCore,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/notifications/{id}/read",
  tags: ["Notifications"],
  summary: "Tandai Satu Notifikasi Sudah Dibaca",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Notifikasi diperbarui",
      content: {
        "application/json": {
          schema: NotificationResponseCore,
        },
      },
    },
    404: { description: "Notifikasi tidak ditemukan" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/notifications/all",
  tags: ["Notifications"],
  summary: "Hapus Semua Notifikasi",
  responses: {
    200: {
      description: "Semua notifikasi berhasil dihapus",
      content: {
        "application/json": {
          schema: NotificationResponseCore,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/notifications/{id}",
  tags: ["Notifications"],
  summary: "Hapus Satu Notifikasi",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: {
      description: "Notifikasi dihapus",
      content: {
        "application/json": {
          schema: NotificationResponseCore,
        },
      },
    },
    404: { description: "Notifikasi tidak ditemukan" },
  },
});
