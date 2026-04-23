import { z } from "zod";
// Jika kamu menggunakan Enum Prisma untuk ROLE, kamu bisa import di sini:
// import { ROLE } from "@/generated/prisma/client";

export const updateUserSchema = z.object({
  body: z
    .object({
      name: z.string().min(3, "Nama minimal 3 karakter").optional(),

      nickname: z.string().optional(),

      avatar_url: z
        .string()
        .url("Format URL avatar tidak valid") // Validasi khusus URL
        .optional(),

      phone_number: z
        .string()
        .min(10, "Nomor telepon minimal 10 angka")
        .regex(
          /^[0-9+]+$/,
          "Nomor telepon hanya boleh berisi angka dan simbol +",
        )
        .optional(),

      bio: z
        .string()
        .max(500, "Bio tidak boleh lebih dari 500 karakter") // Batasi panjang teks
        .optional(),

      address_home: z.string().optional(),

      fcm_token: z.string().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "Setidaknya harus ada satu field yang diupdate",
    }),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>["body"];
