import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const commonHarvestReportFields = {
  cycle_id: z
    .string()
    .uuid("ID Siklus harus berupa UUID yang valid")
    .openapi({ example: "ae53a768-0648-46a9-82bf-8633d76e0525" }),

  total_yield_kg: z
    .number()
    .nonnegative("Total hasil panen tidak boleh negatif")
    .openapi({ example: 1250.5 }),

  ai_quality_metrics: z
    .string()
    .nullable()
    .optional()
    .openapi({
      example: { defects: 96, uniformity: 89, ripeness: 92 },
    }),

  quality_grade: z.string().nullable().optional().openapi({ example: "A" }),

  image_proof_url: z
    .string()
    .url("Format URL bukti gambar tidak valid")
    .nullable()
    .optional()
    .openapi({ example: "https://utfs.io/f/harvest-proof.jpg" }),

  price_sold_per_kg: z
    .number()
    .int()
    .nonnegative("Harga jual tidak boleh negatif")
    .nullable()
    .optional()
    .openapi({ example: 15000 }),
};

export const createHarvestReportBodySchema = z
  .object({
    ...commonHarvestReportFields,
  })
  .strict()
  .openapi("CreateHarvestReportBody");

export const createHarvestReportSchema = z.object({
  body: createHarvestReportBodySchema,
});

export const updateHarvestReportBodySchema = z
  .object({
    ...commonHarvestReportFields,
  })
  .omit({ cycle_id: true }) 
  .partial()
  .strict()
  .openapi("UpdateHarvestReportBody");

export const updateHarvestReportSchema = z.object({
  body: updateHarvestReportBodySchema.refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Setidaknya harus ada satu field yang diupdate",
    },
  ),
});

export type CreateHarvestReportDto = z.infer<
  typeof createHarvestReportBodySchema
>;
export type UpdateHarvestReportDto = z.infer<
  typeof updateHarvestReportBodySchema
>;

registry.register("CreateHarvestReportBody", createHarvestReportBodySchema);
registry.register("UpdateHarvestReportBody", updateHarvestReportBodySchema);
