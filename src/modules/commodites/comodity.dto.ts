import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const commonCommodityFields = {
  name: z
    .string()
    .min(2, "Nama komoditas minimal 2 karakter")
    .openapi({ example: "Jagung" }),
  category: z.enum(
    [
      "MANGROVE",
      "PANGAN",
      " HORTIKULTURA_SAYUR",
      "HORTIKULTURA_BUAH",
      "PERKEBUNAN",
      "HERBAL",
    ],
    {
      error: () => ({ message: "Kategori tidak valid" }),
    },
  ),
  slug_ai: z
    .string()
    .min(2, "Slug AI minimal 2 karakter")
    .regex(
      /^[a-z0-9_]+$/,
      "Slug AI hanya boleh huruf kecil, angka, dan underscore",
    )
    .openapi({ example: "corn" }),

  is_ai_supported: z.boolean().default(false).openapi({ example: true }),
};

export const createCommodityBodySchema = z
  .object({
    ...commonCommodityFields,
  })
  .strict()
  .openapi("CreateCommodityBody");

export const createCommoditySchema = z.object({
  body: createCommodityBodySchema,
});

export const updateCommodityBodySchema = z
  .object({
    ...commonCommodityFields,
  })
  .partial()
  .strict()
  .openapi("UpdateCommodityBody");

export const updateCommoditySchema = z.object({
  body: updateCommodityBodySchema.refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Setidaknya harus ada satu field yang diupdate",
    },
  ),
});

export const importExcelSchema = z.object({
  file: z
    .object({
      fieldname: z.string(),
      originalname: z.string(),
      mimetype: z
        .string()
        .refine(
          (m) =>
            [
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "application/vnd.ms-excel",
            ].includes(m),
          { message: "Hanya menerima file .xlsx atau .xls" },
        ),
      size: z.number().max(5 * 1024 * 1024, "Maksimal 5MB"),
      buffer: z.any(), // Karena pakai memoryStorage
    })
    .optional(),
});

export type CreateCommodityDto = z.infer<typeof createCommodityBodySchema>;
export type UpdateCommodityDto = z.infer<typeof updateCommodityBodySchema>;

registry.register("CreateCommodityBody", createCommodityBodySchema);
registry.register("UpdateCommodityBody", updateCommodityBodySchema);
