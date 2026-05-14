import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const commonUserFields = {
  name: z.string().min(3, "Nama minimal 3 karakter"),

  nickname: z.string().nullable().optional(),
  avatar_url: z
    .string()
    .url("Format URL avatar tidak valid")
    .nullable()
    .optional(),
  phone_number: z
    .string()
    .min(10, "Nomor telepon minimal 10 angka")
    .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh berisi angka dan simbol +")
    .nullable()
    .optional(),
  bio: z
    .string()
    .max(500, "Bio tidak boleh lebih dari 500 karakter")
    .nullable()
    .optional(),
  address_home: z.string().nullable().optional(),
  fcm_token: z.string().nullable().optional(),

  email: z.string().email("Format email tidak valid"),
  role: z.enum(["ADMIN", "FARMER"]).default("FARMER"),
};

export const createUserBodySchema = z
  .object({
    ...commonUserFields,

    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .openapi({ example: "secretpassword123" }),
  })
  .strict()
  .openapi("CreateUserBody");

export const createUserSchema = z.object({
  body: createUserBodySchema,
});

export const updateUserBodySchema = z
  .object({
    ...commonUserFields,
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .openapi({ example: "secretpassword123" }),
  })
  .partial()
  .strict()
  .openapi("UpdateUserBody");

export const updateUserSchema = z.object({
  body: updateUserBodySchema.refine((data) => Object.keys(data).length > 0, {
    message: "Setidaknya harus ada satu field yang diupdate",
  }),
});

export type CreateUserDto = z.infer<typeof createUserBodySchema>;
export type UpdateUserDto = z.infer<typeof updateUserBodySchema>;

registry.register("CreateUserBody", createUserBodySchema);
registry.register("UpdateUserBody", updateUserBodySchema);
