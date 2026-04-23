import { registry } from "@/common/docs/openapi-registry";
import { updateUserSchema } from "./user.dto";
import { commonSchema } from "@/common/utils/schema";

// GET /users (Find All)
registry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  summary: "Mengambil semua data user",
  responses: {
    200: { description: "Berhasil mengambil data" },
  },
});

// GET /users/{id} (Find One)
registry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  summary: "Mendapatkan detail satu user",
  // Catatan: Pastikan commonSchema.paramsId adalah z.object({ id: z.string() })
  request: { params: commonSchema.paramsId },
  responses: {
    200: { description: "User ditemukan" },
  },
});

// PATCH /users/{id} (Update)
registry.registerPath({
  method: "patch",
  path: "/users/{id}",
  tags: ["User"],
  summary: "Update Profil User",
  request: {
    params: commonSchema.paramsId,
    body: {
      content: {
        "application/json": { schema: updateUserSchema.shape.body },
      },
    },
  },
  responses: {
    200: { description: "User berhasil diperbarui" },
  },
});

// DELETE /users/{id} (Delete)
registry.registerPath({
  method: "delete",
  path: "/users/{id}",
  tags: ["User"],
  summary: "Menghapus data user",
  request: { params: commonSchema.paramsId },
  responses: {
    200: { description: "User berhasil dihapus" },
  },
});
