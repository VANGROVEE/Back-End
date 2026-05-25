import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const createLandBodySchema = z
  .object({
    name: z
      .string()
      .min(3, "Nama Minimal 3 Karakter!")
      .openapi({ example: "Kebun Mangrove A" }),

    total_area: z.coerce
      .number()
      .positive("Luas area harus lebih dari 0")
      .openapi({ example: 1500.5 }),

    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
      })
      .strict()
      .openapi({
        example: {
          latitude: -1.5925,
          longitude: 103.614,
          address: "Jambi, Indonesia",
        },
      }),
  })
  .strict()
  .openapi("CreateLandBody");

export const adminCreateLandBodySchema = createLandBodySchema
  .extend({
    owner_id: z
      .string()
      .uuid("Owner ID harus berupa UUID")
      .optional()
      .openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  })
  .strict()
  .openapi("AdminCreateLandBody");

export const createLandSchema = z.object({
  body: createLandBodySchema,
});

export const adminCreateLandSchema = z.object({
  body: adminCreateLandBodySchema,
});

export const updateLandBodySchema = adminCreateLandBodySchema
  .partial()
  .strict()
  .openapi("UpdateLandBody");

export const updateLandSchema = z.object({
  body: updateLandBodySchema,
});

export type CreateLandDto = z.infer<typeof createLandBodySchema>;
export type AdminCreateLandDto = z.infer<typeof adminCreateLandBodySchema>;
export type UpdateLandDto = z.infer<typeof updateLandBodySchema>;

registry.register("CreateLandBody", createLandBodySchema);
registry.register("AdminCreateLandBody", adminCreateLandBodySchema);
registry.register("UpdateLandBody", updateLandBodySchema);
