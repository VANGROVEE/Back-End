import { registry } from "@/common/docs/openapi-registry";
import { RecommendationType } from "@/generated/prisma/enums";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";

extendZodWithOpenApi(z);

export const aiRecommendationQuerySchema = z
  .object({
    cycle_id: z
      .string({ error: "cycle_id wajib diisi" })
      .uuid("cycle_id harus berupa format UUID yang valid")
      .optional()
      .openapi({
        example: "e9c4b155-110c-4776-af91-0ba101fdbf0f",
        description: "ID unik dari siklus tanam untuk memfilter riwayat AI",
      }),
    type: z.enum(RecommendationType).optional().openapi({
      example: "DAILY",
      description: "Jenis rekomendasi: DAILY atau FAILURE_ANALYSIS",
    }),
  })

  .openapi("AiRecommendationQuery");

export const getAiRecommendationSchema = z.object({
  query: aiRecommendationQuerySchema,
});

export type AiRecommendationQueryDto = z.infer<
  typeof aiRecommendationQuerySchema
>;

registry.register("AiRecommendationQuery", aiRecommendationQuerySchema);
