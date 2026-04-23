  import { z } from "zod";

  export const loginSchema = z.object({
    body: z.object({
      email: z
        .string()
        .min(1, "Email wajib diisi")
        .email("Format email tidak valid"),
      password: z.string().min(6, "Password minimal 6 karakter"),
    }),
  });

  export const googleLoginSchema = z.object({
    body: z.object({
      token: z.string().min(1, "Token Google wajib dikirim"),
    }),
  });

  export const registerSchema = z
    .object({
      body: z.object({
        name: z.string().min(3, "Nama minimal 3 karakter"),
        email: z.string().email("Format email tidak valid"),
        password: z.string().min(6, "Password minimal 6 karakter"),
        confirmPassword: z.string(),
      }),
    })
    .refine((data) => data.body.password === data.body.confirmPassword, {
      message: "Konfirmasi password tidak cocok",
      path: ["body", "confirmPassword"],
    });

  export type RegisterDto = z.infer<typeof registerSchema>["body"];
  export type GoogleLoginDto = z.infer<typeof googleLoginSchema>["body"];
  export type LoginDto = z.infer<typeof loginSchema>["body"];
