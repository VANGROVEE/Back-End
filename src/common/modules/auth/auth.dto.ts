import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Format email tidak valid")
      .openapi({ example: "budi@vangrove.com" }), // Contoh email
    password: z.string().min(6).openapi({ example: "secretpassword123" }), // Contoh password
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    token: z.string().openapi({ example: "eyJhbGciOiJSUzI1NiIsImtpZCI6..." }), // Contoh JWT Google
  }),
});

export const registerSchema = z
  .object({
    body: z.object({
      name: z.string().openapi({ example: "Budi Petani Modern" }),
      email: z.string().email().openapi({ example: "budi@vangrove.com" }),
      password: z.string().min(6).openapi({ example: "secretpassword123" }),
      confirmPassword: z.string().openapi({ example: "secretpassword123" }),
    }),
  })
  .refine((data) => data.body.password === data.body.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });
export type LoginDto = z.infer<typeof loginSchema>["body"];
export type GoogleLoginDto = z.infer<typeof googleLoginSchema>["body"];

export type RegisterAuhtDto = Omit<
  z.infer<typeof registerSchema>["body"],
  "confirmPassword"
>;
export type UpdateAuthDto = Partial<Omit<RegisterAuhtDto, "confirmPassword">>;
