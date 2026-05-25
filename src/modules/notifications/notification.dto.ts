import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createNotificationBodySchema = z
  .object({
    user_id: z
      .string()
      .uuid("User ID harus berupa UUID")
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),

    title: z
      .string()
      .min(1, "Judul tidak boleh kosong")
      .openapi({ example: "Siklus Tanam Dimulai" }),

    message: z.string().min(1, "Pesan tidak boleh kosong").openapi({
      example: "Siklus tanam padi di Lahan A telah berhasil dimulai.",
    }),

    type: z
      .enum(["info", "success", "warning", "error"])
      .default("info")
      .openapi({ example: "success" }),
  })
  .strict()
  .openapi("CreateNotificationBody");

export const notificationResponseSchema = createNotificationBodySchema
  .extend({
    id: z
      .string()
      .uuid()
      .openapi({ example: "987f6543-e21b-12d3-a456-426614174000" }),
    is_read: z.boolean().openapi({ example: false }),
    created_at: z
      .string()
      .datetime()
      .openapi({ example: "2026-05-25T08:00:00Z" }),
  })
  .openapi("NotificationResponse");

export const createNotificationSchema = z.object({
  body: createNotificationBodySchema,
});

export type CreateNotificationDto = z.infer<
  typeof createNotificationBodySchema
>;
export type NotificationResponseDto = z.infer<
  typeof notificationResponseSchema
>;

registry.register("CreateNotificationBody", createNotificationBodySchema);
registry.register("NotificationResponse", notificationResponseSchema);
