import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("8000").transform(Number),
  HOST: z.string().default("localhost"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  SUPABASE_URL: z
    .string()
    .url({ message: "SUPABASE_URL harus berupa URL yang valid" }),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: "SUPABASE_SERVICE_ROLE_KEY tidak boleh kosong" }),

  JWT_SECRET: z.string().min(32, "Secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("1d"),

  GEMINI_API_KEY: z
    .string()
    .min(1, { message: "GEMINI_API_KEY wajib diisi untuk fitur AI" }),

  OPENWEATHER_API_KEY: z
    .string()
    .min(1, { message: "OPENWEATHER_API_KEY wajib diisi untuk fitur Cuaca" }),
  OPENWEATHER_BASE_URL: z
    .string()
    .url({ message: "OPENWEATHER_BASE_URL harus berupa URL yang valid" })
    .default("https://api.openweathermap.org/data/2.5/forecast"),
  UPLOADTHING_SECRET: z
    .string()
    .min(1, { message: "UPLOADTHING_SECRET wajib diisi" }),
  UPLOADTHING_APP_ID: z
    .string()
    .min(1, { message: "UPLOADTHING_APP_ID wajib diisi" }),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
