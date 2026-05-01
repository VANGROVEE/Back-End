import { registry } from "@/common/docs/openapi-registry";
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
      format: "date",
      example: "2026-05-01",
      description: "Tanggal aktivitas (Format: YYYY-MM-DD)",
    }),
    activity_type: z
      .string()
      .min(1, "Tipe aktivitas wajib diisi")
      .openapi({ example: "Penyiraman" }),
    amount: z
      .number()
      .positive("Jumlah/Amount harus bernilai positif")
      .optional()
      .openapi({ example: 15.5 }),
    unit: z.string().optional().openapi({ example: "liter" }),
    notes: z
      .string()
      .optional()
      .openapi({ example: "Penyiraman pagi hari dengan pompa utama" }),
    weather_data: weatherDataSchema.optional(),
  })
  .strict()
  .openapi("CreateDailyActivityBody");

export const createDailyActivitySchema = z.object({
  body: createDailyActivityBodySchema,
});

export type CreateDailyActivityDto = z.infer<
  typeof createDailyActivityBodySchema
>;

registry.register("CreateDailyActivityDto", createDailyActivityBodySchema);

export const updateDailyActivityBodySchema = z
  .object({
    activity_date: z.coerce.date().optional().openapi({
      type: "string",
      format: "date",
      example: "2026-05-02",
    }),
    activity_type: z
      .string()
      .min(1)
      .optional()
      .openapi({ example: "Pemupukan Susulan" }),
    amount: z.number().positive().optional().openapi({ example: 5 }),
    unit: z.string().optional().openapi({ example: "kg" }),
    notes: z
      .string()
      .optional()
      .openapi({ example: "Menggunakan pupuk organik cair" }),
    weather_data: weatherDataSchema.optional(),
  })
  .strict()
  .openapi("UpdateDailyActivityBody");

export const updateDailyActivityParamsSchema = z.object({
  id: z
    .string()
    .uuid("ID Aktivitas harus berupa UUID")
    .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
});

export const updateDailyActivitySchema = z.object({
  body: updateDailyActivityBodySchema,
  params: updateDailyActivityParamsSchema,
});

export type UpdateDailyActivityDto = z.infer<
  typeof updateDailyActivityBodySchema
>;

registry.register("UpdateDailyActivityDto", updateDailyActivityBodySchema);
