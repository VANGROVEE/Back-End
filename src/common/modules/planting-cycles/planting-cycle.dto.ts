import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createPlantingCycleBodySchema = z
  .object({
    land_id: z
      .string()
      .uuid("ID Lahan harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    commodity_name: z
      .string()
      .min(1, "Nama komoditas wajib diisi")
      .openapi({ example: "Mangrove Rhizophora" }),
    variety: z.string().nullable().optional().openapi({ example: "Mucronata" }),
    planting_method: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Semaian Polibek" }),
    start_date: z.coerce.date().openapi({
      type: "string",
      format: "date-time",
      example: "2026-04-30T08:00:00Z",
    }),
    estimated_harvest: z.coerce.date().nullable().optional().openapi({
      type: "string",
      format: "date-time",
      example: "2026-10-30T08:00:00Z",
    }),
    status: z
      .enum(["ACTIVE", "COMPLETED", "FAILED"])
      .default("ACTIVE")
      .openapi({ example: "ACTIVE" }),
  })
  .strict()
  .openapi("CreatePlantingCycleBody");

export const createPlantingCycleSchema = z.object({
  body: createPlantingCycleBodySchema,
});

export type CreatePlantingCycleDto = z.infer<
  typeof createPlantingCycleBodySchema
>;

registry.register("CreatePlantingCycleDto", createPlantingCycleBodySchema);
