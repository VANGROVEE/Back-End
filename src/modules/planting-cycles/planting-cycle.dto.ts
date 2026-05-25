import { registry } from "@/common/docs/openapi-registry";
import { STATUS } from "@/generated/prisma/enums";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createPlantingCycleBodySchema = z
  .object({
    land_id: z
      .string()
      .uuid("ID Lahan harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),

    commodity_id: z
      .string()
      .uuid("ID Lahan harus berupa UUID yang valid")
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
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

    status: z.enum(STATUS).default("PLANTING").openapi({ example: "PLANTING" }),
  })
  .strict()
  .openapi("CreatePlantingCycleBody");

export const getPlantingCycleQuerySchema = z
  .object({
    land_id: z
      .string()
      .uuid("land_id harus berupa UUID")
      .optional()
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),

    cycle_id: z
      .string()
      .uuid("cycle_id harus berupa UUID")
      .optional()
      .openapi({ example: "e9c4b155-110c-4776-af91-0ba101fdbf0f" }),

    status: z
      .enum(["ACTIVE", "HARVESTED", "COMPLETED", "FAILED"])
      .optional()
      .openapi({ example: "ACTIVE" }),
  })
  .openapi("GetPlantingCycleQuery");

export const createPlantingCycleSchema = z.object({
  body: createPlantingCycleBodySchema,
});

export const updatePlantingCycleBodySchema = createPlantingCycleBodySchema
  .partial()
  .strict()
  .openapi("UpdatePlantingCycleBody");

export const updatePlantingCycleSchema = z.object({
  body: updatePlantingCycleBodySchema.refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Setidaknya harus ada satu field yang diupdate",
    },
  ),
});

export const getPlantingCycleSchema = z.object({
  query: getPlantingCycleQuerySchema,
});

export type CreatePlantingCycleDto = z.infer<
  typeof createPlantingCycleBodySchema
>;

export type UpdatePlantingCycleDto = z.infer<
  typeof updatePlantingCycleBodySchema
>;

export type GetPlantingCycleQueryDto = z.infer<
  typeof getPlantingCycleQuerySchema
>;

registry.register("GetPlantingCycleQuery", getPlantingCycleQuerySchema);
registry.register("CreatePlantingCycleBody", createPlantingCycleBodySchema);
registry.register("UpdatePlantingCycleBody", updatePlantingCycleBodySchema);
