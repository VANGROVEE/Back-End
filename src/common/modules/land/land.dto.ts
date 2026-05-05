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
          latitude: -6.1751,
          longitude: 106.8272,
          address: "Jambi, Indonesia",
        },
      }),
  })

  .strict()
  .openapi("CreateLandBody");

export const createLandSchema = z.object({
  body: createLandBodySchema,
});

export const updateLandBodySchema = createLandBodySchema
  .partial()
  .strict()
  .openapi("UpdateLandBody");

export const updateLandSchema = z.object({
  body: updateLandBodySchema,
});

export type CreateLandDto = z.infer<typeof createLandBodySchema>;
export type UpdateLandDto = z.infer<typeof updateLandBodySchema>;

registry.register("CreateLandBody", createLandBodySchema);
registry.register("UpdateLandBody", updateLandBodySchema);
