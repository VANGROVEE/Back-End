import { z, ZodObject } from "zod";

export const commonSchema = {
  paramsId: z.object({
    params: z.object({
      id: z
        .string()
        .uuid("Format ID tidak valid, pastikan menggunakan UUID yang benar"),
    }),
  }),
  withId: (schema: ZodObject) => {
    return commonSchema.paramsId.merge(schema);
  },

  // Bonus: Schema untuk paginasi (sering dipakai di findAll)
  //   pagination: z.object({
  //     query: z.object({
  //       page: z.string().optional().transform(Number),
  //       limit: z.string().optional().transform(Number),
  //       search: z.string().optional(),
  //     }),
  //   }),
};
