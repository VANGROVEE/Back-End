import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";

extendZodWithOpenApi(z);

/**
 * 1. Schema untuk Predict Only (Preview AI) Menambahkan parameter top_k dan
 *    explain sesuai kebutuhan server ML
 */
export const predictOnlyBodySchema = z
  .object({
    image_url: z
      .string()
      .url("URL gambar harus berupa tautan yang valid")
      .openapi({
        example:
          "https://utfs.io/f/xnWEjJrtEUj0FJnAgD75oP69HD1V732KGgUW8RCicsjfudAQ",
      }),

    top_k: z.number().int().min(1).default(3).openapi({
      example: 3,
      description: "Jumlah kandidat prediksi teratas yang dikembalikan",
    }),

    explain: z.boolean().default(true).openapi({
      example: true,
      description: "Apakah AI harus memberikan penjelasan detail/insight",
    }),
  })
  .strict()
  .openapi("PredictOnlyBody");

/**
 * 2. Schema untuk Menyimpan Report (Database) Menerima hasil AI (ai_raw_result)
 *    yang sudah didapat dari Preview
 */
export const saveHealthReportBodySchema = z
  .object({
    cycle_id: z
      .string()
      .uuid("ID Siklus Tanam harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),

    image_url: z
      .string()
      .url("URL gambar harus berupa tautan yang valid")
      .openapi({ example: "https://utfs.io/f/leaf-sample.jpg" }),

    image_key: z
      .string()
      .min(1, "Image key diperlukan untuk manajemen berkas storage")
      .openapi({ example: "leaf-sample-key-123" }),

    notes: z
      .string()
      .optional()
      .openapi({ example: "Ditemukan bercak hitam pada daun bagian bawah." }),

    ai_raw_result: z
      .object({
        disease_name: z.string(),
        confidence_score: z.number(),
        is_dangerous: z.boolean(),
        insight: z.object({
          disease_description: z.string(),
          causes: z.string(),
          treatment: z.array(z.string()),
          prevention: z.array(z.string()),
          recovery: z.string(),
        }),
      })
      .openapi("AiRawResult"),
  })
  .strict()
  .openapi("SaveHealthReportBody");

// Schema Wrapper untuk Validation Middleware (Request)
export const predictOnlySchema = z.object({
  body: predictOnlyBodySchema,
});

export const saveHealthReportSchema = z.object({
  body: saveHealthReportBodySchema,
});

// Types Export
export type PredictOnlyDto = z.infer<typeof predictOnlyBodySchema>;
export type SaveHealthReportDto = z.infer<typeof saveHealthReportBodySchema>;

// OpenAPI Registry
registry.register("PredictOnlyBody", predictOnlyBodySchema);
registry.register("SaveHealthReportBody", saveHealthReportBodySchema);
