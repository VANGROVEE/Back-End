import { registry } from "@/common/docs/openapi-registry";
import { ActivityType } from "@/generated/prisma/client";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export interface AiInsightDetails {
  disease_description: string;
  causes: string;
  treatment: string[];
  prevention: string[];
  recovery: string;
}

export interface AiRawResultDto {
  disease_name: string;
  confidence_score: number;
  is_dangerous: boolean;
  insight: AiInsightDetails;
}

export const aiRawResultSchema = z
  .object({
    disease_name: z.string().openapi({ example: "Tomato Early Blight" }),
    confidence_score: z.number().openapi({ example: 0.98 }),
    is_dangerous: z.boolean().openapi({ example: true }),
    insight: z.object({
      disease_description: z
        .string()
        .openapi({ example: "Bercak daun kering..." }),
      causes: z.string().openapi({ example: "Jamur Alternaria solani" }),
      treatment: z
        .array(z.string())
        .openapi({ example: ["Petik daun terinfeksi"] }),
      prevention: z.array(z.string()).openapi({ example: ["Rotasi tanaman"] }),
      recovery: z.string().openapi({
        example: "Tanaman dapat pulih jika belum menyerang batang utama",
      }),
    }),
  })
  .openapi("AiRawResult");

export const weatherDataSchema = z
  .object({
    condition: z.string().optional().openapi({ example: "Cerah" }),
    temperature: z.number().optional().openapi({ example: 28.5 }),
    humidity: z.number().optional().openapi({ example: 80 }),
    wind_speed: z.number().optional().openapi({ example: 12 }),
  })
  .openapi("WeatherData");

export const createDailyActivityBodySchema = z
  .object({
    cycle_id: z
      .string()
      .uuid("ID Siklus harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    activity_date: z.coerce
      .date()
      .openapi({ type: "string", format: "date-time" }),
    activity_type: z
      .nativeEnum(ActivityType, {
        error: () => ({ message: "Tipe aktivitas tidak valid" }),
      })
      .openapi({ example: ActivityType.FERTILIZING }),
    amount: z.coerce
      .number()
      .positive("Jumlah harus bernilai positif")
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    unit: z
      .string()
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    notes: z.string().nullable().optional(),
    weather_data: weatherDataSchema.nullable().optional(),
    total_yield_kg: z.coerce
      .number()
      .nonnegative("Total hasil panen tidak boleh negatif")
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    image_proof_url: z
      .string()
      .url("Format URL tidak valid")
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    quality_grade: z.string().nullable().optional(),
    image_url: z
      .string()
      .url("URL gambar harus valid")
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    image_key: z.string().nullable().optional(),
    ai_raw_result: aiRawResultSchema.nullable().optional(),
    is_productive: z.boolean().default(true).optional(),
  })
  .strict()
  .openapi("CreateDailyActivityBody");

export const getDailyActivitiesQuerySchema = z.object({
  query: z.object({
    cycle_id: z
      .string()
      .uuid("ID Siklus harus berupa UUID")
      .optional()
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  }),
});

export const createDailyActivitySchema = z.object({
  body: createDailyActivityBodySchema,
});

export const updateDailyActivityBodySchema = createDailyActivityBodySchema
  .omit({ cycle_id: true })
  .partial()
  .strict()
  .openapi("UpdateDailyActivityBody");

export const updateDailyActivityParamsSchema = z.object({
  id: z.string().uuid("ID Aktivitas harus berupa UUID"),
});

export const updateDailyActivitySchema = z.object({
  body: updateDailyActivityBodySchema,
  params: updateDailyActivityParamsSchema,
});

export type CreateDailyActivityDto = z.infer<
  typeof createDailyActivityBodySchema
>;
export type UpdateDailyActivityDto = z.infer<
  typeof updateDailyActivityBodySchema
>;
export type GetDailyActivitiesQueryDto = z.infer<
  typeof getDailyActivitiesQuerySchema
>;

registry.register("AiRawResult", aiRawResultSchema);
registry.register("CreateDailyActivityBody", createDailyActivityBodySchema);
registry.register("UpdateDailyActivityBody", updateDailyActivityBodySchema);
registry.register("GetDailyActivitiesQuery", getDailyActivitiesQuerySchema);
