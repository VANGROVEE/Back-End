import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { loginSchema, registerSchema, googleLoginSchema } from "./auth.dto";

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  message: z.string().openapi({ example: "Pesan kesalahan sistem" }),
});

const userProfileSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
  name: z.string().openapi({ example: "Budi Petani Modern" }),
  email: z.string().email().openapi({ example: "budi@vangrove.com" }),
  role: z.enum(["ADMIN", "FARMER"]).openapi({ example: "FARMER" }),
  avatar_url: z
    .string()
    .nullable()
    .openapi({ example: "https://storage.com/avatar.jpg" }),
});

const authSuccessSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: "Autentikasi Berhasil" }),
  user: userProfileSchema,
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login Tradisional",
  description:
    "Autentikasi menggunakan email dan password. Mengembalikan data user dan memasang HTTP-Only Cookie.",
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
      description: "Login Berhasil",
      content: { "application/json": { schema: authSuccessSchema } },
    },
    401: {
      description: "Email atau password salah",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Ambil Data Profil Sesi",
  description:
    "Mengecek validitas cookie 'be_token' dan mengembalikan profil user yang sedang login.",
  responses: {
    200: {
      description: "Sesi Valid",
      content: { "application/json": { schema: authSuccessSchema } },
    },
    401: {
      description: "Sesi tidak ditemukan atau kadaluwarsa",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Pendaftaran Akun Baru",
  description:
    "Mendaftarkan petani baru. Field password dan confirmPassword harus identik.",
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
      description: "Akun Berhasil Dibuat",
      content: { "application/json": { schema: authSuccessSchema } },
    },
    400: {
      description: "Validasi gagal atau email sudah digunakan",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/google",
  tags: ["Auth"],
  summary: "Login/Register via Google",
  description:
    "Autentikasi via Google OAuth2 ID Token. Jika email baru, akun akan otomatis dibuat (Upsert).",
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
      description: "Google Auth Berhasil",
      content: { "application/json": { schema: authSuccessSchema } },
    },
    400: {
      description: "ID Token tidak valid",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
