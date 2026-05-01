export const dailyActivityDocs = {
  "/daily-activities": {
    post: {
      tags: ["Daily Activities"],
      summary: "Mencatat aktivitas harian baru",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["cycle_id", "activity_type"],
              properties: {
                cycle_id: { type: "string", format: "uuid" },
                activity_type: { type: "string", example: "Penyiraman" },
                amount: { type: "number", example: 15.5 },
                unit: { type: "string", example: "liter" },
                notes: { type: "string", example: "Penyiraman pagi hari" },
                weather_data: {
                  type: "object",
                  properties: {
                    condition: { type: "string", example: "Cerah" },
                    temperature: { type: "number", example: 28.5 },
                    humidity: { type: "number", example: 70 },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Aktivitas harian berhasil dicatat" },
        400: { description: "Validasi gagal / Siklus tidak aktif" },
      },
    },
    get: {
      tags: ["Daily Activities"],
      summary: "Mendapatkan semua aktivitas harian",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Berhasil mengambil data" },
      },
    },
  },
};
