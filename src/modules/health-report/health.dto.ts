import { registry } from "@/common/docs/openapi-registry";
import z from "zod";

export const healthReportSchema = z
  .object({
    cycle_id: z
      .string()
      .uuid("ID Siklus harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),

    disease_id: z
      .string()
      .uuid("ID Penyakit harus berupa UUID yang valid")
      .nullable()
      .optional()
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),

    image_url: z
      .string()
      .url("URL gambar tidak valid")
      .openapi({ example: "https://utfs.io/f/any-random-key.png" }),

    image_key: z
      .string()
      .min(1, "Image key diperlukan untuk pengelolaan file")
      .openapi({ example: "any-random-key.png" }),

    confidence_score: z
      .number()
      .min(0)
      .max(1)
      .nullable()
      .optional()
      .openapi({ example: 0.85 }),

    gemini_insight: z
      .any()
      .nullable()
      .optional()
      .openapi({
        example: { diagnosis: "Healthy", advice: "Maintain watering" },
      }),

    is_outbreak_trigger: z.boolean().default(false).openapi({ example: false }),
  })
  .strict()
  .openapi("CreateHealthReportBody");

export const updateHealthReportSchema = healthReportSchema
  .partial()
  .openapi("UpdateHealthReportBody");

export const healthReportQuerySchema = z
  .object({
    cycle_id: z
      .string()
      .uuid("ID Cycle harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" })
      .optional(),
  })
  .strict()
  .openapi("GetHealthReportQuery");

export const createHealthReportBodySchema = z.object({
  body: healthReportSchema,
});

export const updateHealthReportBodySchema = z.object({
  body: updateHealthReportSchema,
});

export const getHealthReportQuerySchema = z.object({
  query: healthReportQuerySchema,
});

export type CreateHealthReportDto = z.infer<typeof healthReportSchema>;
export type UpdateHealthReportDto = z.infer<typeof updateHealthReportSchema>;
export type GetHealthReportQueryDto = z.infer<typeof healthReportQuerySchema>;

registry.register("CreateHealthReportBody", healthReportSchema);
registry.register("UpdateHealthReportBody", updateHealthReportSchema);
registry.register("GetHealthReportQuery", healthReportQuerySchema);
