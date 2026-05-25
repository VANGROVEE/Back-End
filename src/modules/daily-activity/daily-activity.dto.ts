import { registry } from "@/common/docs/openapi-registry";
import { ActivityType } from "@/generated/prisma/client";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

/**
 * 🌟 1. Deklarasi TypeScript Interface (Untuk Service) Interface ini digunakan
 * oleh DailyActivityService agar type-safe
 */
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

/** 🌟 2. Zod Schema untuk AiRawResult (Untuk API Validation) */
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
        .openapi({ example: ["Petik daun terinfeksi", "Gunakan fungisida"] }),
      prevention: z
        .array(z.string())
        .openapi({ example: ["Rotasi tanaman", "Gunakan mulsa"] }),
      recovery: z.string().openapi({
        example: "Tanaman dapat pulih jika belum menyerang batang utama",
      }),
    }),
  })
  .openapi("AiRawResult");

/** 3. Weather Data Schema */
export const weatherDataSchema = z
  .object({
    condition: z.string().optional().openapi({ example: "Cerah" }),
    temperature: z.number().optional().openapi({ example: 28.5 }),
    humidity: z.number().optional().openapi({ example: 80 }),
    wind_speed: z.number().optional().openapi({ example: 12 }),
  })
  .openapi("WeatherData");

/** 4. Create Daily Activity Body Schema */
export const createDailyActivityBodySchema = z
  .object({
    cycle_id: z
      .string()
      .uuid("ID Siklus harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),

    activity_date: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
    }),

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

    // Field khusus Harvesting
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

    // Field khusus Observation/AI
    image_url: z
      .string()
      .url("URL gambar harus valid")
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),

    image_key: z.string().nullable().optional(),

    // 🌟 Menggunakan aiRawResultSchema yang sudah dideklarasikan
    ai_raw_result: aiRawResultSchema.nullable().optional(),

    is_productive: z.boolean().default(true).optional(),
  })
  .strict()
  .openapi("CreateDailyActivityBody");

/** 5. Update & Requests Schemas */
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

/** 🌟 6. DTO Inference */
export type CreateDailyActivityDto = z.infer<
  typeof createDailyActivityBodySchema
>;
export type UpdateDailyActivityDto = z.infer<
  typeof updateDailyActivityBodySchema
>;

// Register ke OpenAPI Registry
registry.register("AiRawResult", aiRawResultSchema);
registry.register("CreateDailyActivityBody", createDailyActivityBodySchema);
registry.register("UpdateDailyActivityBody", updateDailyActivityBodySchema);
