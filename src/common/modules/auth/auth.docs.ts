import { registry } from "@/common/docs/openapi-registry";
import { z } from "zod";
import { loginSchema, registerSchema } from "./auth.dto";

// Schema untuk response error sederhana
const errorResponseSchema = z.object({
  message: z.string().openapi({ example: "Pesan kesalahan sistem" }),
});

// Schema untuk response sukses (Base)
const authSuccessSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
  }),
});

const authSuccessExample = {
  token: "pk_supabase_token_anda_disini",
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Budi Petani Modern",
    email: "budi@vangrove.com",
    role: "FARMER",
  },
};

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login Credential",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema.shape.body, // Langsung akses shape
        },
      },
    },
  },
  responses: {
    200: {
      description: "Berhasil login",
      content: {
        "application/json": {
          schema: authSuccessSchema,
          example: authSuccessExample,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { message: "Email atau password salah" },
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Pendaftaran Akun Baru",
  request: {
    body: {
      content: {
        "application/json": {
          // PERBAIKAN ZOD V4: Langsung akses shape.body meskipun ada .refine()
          schema: registerSchema.shape.body,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Registrasi Berhasil",
      content: {
        "application/json": {
          schema: authSuccessSchema,
          example: authSuccessExample,
        },
      },
    },
    409: {
      description: "Conflict",
      content: {
        "application/json": {
          schema: errorResponseSchema,
          example: { message: "Email sudah terdaftar" },
        },
      },
    },
  },
});
