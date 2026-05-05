import { registry } from "@/common/docs/openapi-registry";
import { commonSchema } from "@/common/utils/schema";
import { updateUserSchema } from "./user.dto";

// GET ALL USERS
registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  summary: "Mengambil semua data user",
  description:
    "Menampilkan daftar seluruh pengguna yang terdaftar di sistem Vangrove. Biasanya digunakan oleh admin.",
  responses: {
    200: {
      description: "Berhasil mengambil daftar user",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Daftar user berhasil diambil",
              },
              data: { type: "array", items: { type: "object" } }, // Bisa diganti dengan UserSchema jika ada
            },
          },
        },
      },
    },
  },
});

// GET USER BY ID
registry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  summary: "Mendapatkan detail satu user",
  description: "Mengambil informasi profil lengkap berdasarkan ID user.",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: { description: "Data user ditemukan" },
    404: { description: "User tidak ditemukan" },
  },
});

// PATCH UPDATE USER
registry.registerPath({
  method: "patch",
  path: "/users/{id}",
  tags: ["User"],
  summary: "Update Profil User",
  description:
    "Memperbarui data profil seperti nama atau foto profil berdasarkan ID user.",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": {
          schema: updateUserSchema.shape.body, // Mengambil field yang boleh diupdate dari DTO
        },
      },
    },
  },
  responses: {
    200: { description: "Profil user berhasil diperbarui" },
    400: { description: "Input data tidak valid" },
    404: { description: "User tidak ditemukan" },
  },
});

// DELETE USER
registry.registerPath({
  method: "delete",
  path: "/users/{id}",
  tags: ["User"],
  summary: "Menghapus data user",
  description: "Menghapus akun user secara permanen dari sistem.",
  request: {
    params: commonSchema.paramsId,
  },
  responses: {
    200: { description: "Akun user berhasil dihapus" },
    404: { description: "User tidak ditemukan" },
  },
});
