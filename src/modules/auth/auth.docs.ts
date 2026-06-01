import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { loginSchema, registerSchema, googleLoginSchema } from "./auth.dto";

// --- Reusable Schemas ---

const errorResponseSchema = z.object({
  message: z.string().openapi({ example: "Pesan kesalahan sistem" }),
});

const authSuccessSchema = z.object({
  token: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR..." }),
  user: z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    name: z.string().openapi({ example: "Budi Petani Modern" }),
    email: z.string().email().openapi({ example: "budi@vangrove.com" }),
    role: z.string().openapi({ example: "FARMER" }),
  }),
});

// --- Documentation Paths ---

// 1. LOGIN CREDENTIAL
registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login Tradisional",
  description: "Masuk menggunakan email dan password yang terdaftar.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Berhasil login",
      content: { "application/json": { schema: authSuccessSchema } },
    },
    401: {
      description: "Kredensial salah",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

// 2. REGISTER ACCOUNT
registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Pendaftaran Akun Baru",
  description: "Mendaftarkan petani baru ke dalam sistem Vangrove.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Registrasi Berhasil",
      content: { "application/json": { schema: authSuccessSchema } },
    },
    400: {
      description: "Validasi Gagal",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

// 3. GOOGLE LOGIN (NEW)
registry.registerPath({
  method: "post",
  path: "/auth/google",
  tags: ["Auth"],
  summary: "Login/Register via Google",
  description:
    "Autentikasi menggunakan Google ID Token. Jika user belum terdaftar, sistem akan otomatis membuatkan akun.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: googleLoginSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Berhasil autentikasi via Google",
      content: { "application/json": { schema: authSuccessSchema } },
    },
    400: {
      description: "Token tidak valid",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
