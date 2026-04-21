import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("8000").transform(Number),
  HOST: z.string().default("localhost"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Tambahkan validasi string dan URL untuk Supabase
  SUPABASE_URL: z
    .string()
    .url({ message: "SUPABASE_URL harus berupa URL yang valid" }),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: "SUPABASE_SERVICE_ROLE_KEY tidak boleh kosong" }),
  JWT_SECRET: z.string().min(32, "Secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
