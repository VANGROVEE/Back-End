import { registry } from "@/common/docs/openapi-registry";
import { ActivityType } from "@/generated/prisma/client";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const weatherDataSchema = z
  .object({
    condition: z.string().optional().openapi({ example: "Cerah" }),
    temperature: z.number().optional().openapi({ example: 28.5 }),
    humidity: z.number().optional().openapi({ example: 80 }),
    wind_speed: z.number().optional().openapi({ example: 12 }),
  })
  .openapi("WeatherData");

registry.register("WeatherData", weatherDataSchema);

export const createDailyActivityBodySchema = z
  .object({
    cycle_id: z
      .string()
      .uuid("ID Siklus harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),

    activity_date: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2026-05-02T00:00:00Z",
    }),

    activity_type: z
      .nativeEnum(ActivityType, {
        error: () => ({ message: "Tipe aktivitas tidak valid" }),
      })
      .openapi({ example: ActivityType.FERTILIZING }),

    amount: z
      .number()
      .positive("Jumlah/Amount harus bernilai positif")
      .nullable()
      .optional()
      .openapi({ example: 15.5 }),

    unit: z.string().nullable().optional().openapi({ example: "liter" }),

    notes: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Penyiraman pagi hari dengan pompa utama" }),

    weather_data: weatherDataSchema.nullable().optional(),
  })
  .strict()
  .openapi("CreateDailyActivityBody");

export const createDailyActivitySchema = z.object({
  body: createDailyActivityBodySchema,
});

export const updateDailyActivityBodySchema = createDailyActivityBodySchema
  .omit({ cycle_id: true })
  .partial()
  .strict()
  .openapi("UpdateDailyActivityBody");

export const updateDailyActivityParamsSchema = z.object({
  id: z
    .string()
    .uuid("ID Aktivitas harus berupa UUID")
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
});

export const updateDailyActivitySchema = z.object({
  body: updateDailyActivityBodySchema.refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Setidaknya harus ada satu field yang diupdate",
    },
  ),
  params: updateDailyActivityParamsSchema,
});

export type CreateDailyActivityDto = z.infer<
  typeof createDailyActivityBodySchema
>;
export type UpdateDailyActivityDto = z.infer<
  typeof updateDailyActivityBodySchema
>;

registry.register("CreateDailyActivityBody", createDailyActivityBodySchema);
registry.register("UpdateDailyActivityBody", updateDailyActivityBodySchema);
