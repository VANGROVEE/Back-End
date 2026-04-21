import { defineConfig } from "@prisma/config";
import "dotenv/config";

// Tentukan URL mana yang akan digunakan
// Kita deteksi jika perintahnya adalah 'db' atau 'migrate'
const isManagementCommand = process.argv.some((arg) =>
  ["db", "migrate"].includes(arg),
);

const dbUrl = isManagementCommand
  ? process.env["DIRECT_URL"]
  : process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: dbUrl,
  },
});
