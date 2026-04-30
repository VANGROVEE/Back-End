import { registry } from "@/common/docs/openapi-registry";
import { googleLoginSchema, loginSchema, registerSchema } from "./auth.dto";

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login Credential",
  description:
    "Masuk ke sistem menggunakan email dan password yang sudah terdaftar.",
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
    200: { description: "Berhasil login dan mendapatkan akses token" },
    401: { description: "Email atau password salah" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Pendaftaran Akun Baru",
  description:
    "Membuat akun baru sebagai Farmer (Petani) di platform Vangrove.",
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
    201: { description: "Akun berhasil dibuat" },
    409: { description: "Email sudah digunakan" },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/google-login",
  tags: ["Auth"],
  summary: "Login/Register via Google",
  description:
    "Autentikasi menggunakan ID Token dari Google/Supabase. Jika email belum terdaftar, sistem akan otomatis membuatkan akun baru.",
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
    200: { description: "Berhasil autentikasi via Google" },
    401: { description: "Token Google tidak valid" },
  },
});
