import { BaseService } from "@/common/base/service";
import { env } from "@/common/config/env";
import { prisma } from "@/common/config/prisma";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import { calculateDistance, getRadiusFromArea } from "@/common/utils/geo";
import type { HealthReport } from "@/generated/prisma/client";
import axios from "axios";

export interface AIAnalysisResult {
  isValidPlant: boolean;
  disease_name: string;
  confidence_score: number;
  insight: {
    disease_description: string;
    causes: string;
    treatment: string[];
    prevention: string[];
    recovery: string;
  };
  is_dangerous: boolean;
}

const AI_ENDPOINT =
  env.AI_MODEL_ENDPOINT ||
  "https://ai-engineer-production-382f.up.railway.app/predict";

class AiModelService extends BaseService<
  HealthReport,
  typeof prisma.healthReport
> {
  constructor() {
    super(prisma.healthReport, "health-reports");
  }

  async predictOnly(imageUrl: string): Promise<AIAnalysisResult> {
    return await this.hitMlServer(imageUrl);
  }

  async saveHealthReport(
    payload: {
      cycle_id: string;
      image_url: string;
      image_key: string;
      notes?: string;
      ai_raw_result: AIAnalysisResult;
    },
    tx?: any,
  ) {
    const db = tx || prisma;

    const cycleExists = await db.plantingCycle.findUnique({
      where: { id: payload.cycle_id },
      include: { land: true },
    });

    if (!cycleExists) throw new ApiError(404, "Siklus tanam tidak ditemukan.");

    const { ai_raw_result } = payload;

    let matchedDisease = null;
    if (
      ai_raw_result.isValidPlant &&
      ai_raw_result.disease_name !== "unknown"
    ) {
      matchedDisease = await cacheHelper.getOrSet(
        `disease:label:${ai_raw_result.disease_name}`,
        async () => {
          return await db.disease.findUnique({
            where: { label_ai: ai_raw_result.disease_name },
          });
        },
        86400,
      );
    }

    const geminiInsightPayload = {
      ...ai_raw_result.insight,
      farmer_notes: payload.notes || null,
      analyzed_at: new Date().toISOString(),
    };

    const newReport = await db.healthReport.create({
      data: {
        cycle_id: payload.cycle_id,
        disease_id: matchedDisease ? matchedDisease.id : null,
        image_url: payload.image_url,
        image_key: payload.image_key,
        confidence_score: ai_raw_result.confidence_score,
        gemini_insight: geminiInsightPayload as any,
        is_outbreak_trigger: ai_raw_result.is_dangerous,
      },
      include: { disease: true },
    });

    if (
      newReport.is_outbreak_trigger &&
      matchedDisease &&
      cycleExists.land.location
    ) {
      this.handleOutbreakAlert(cycleExists.land, matchedDisease).catch((err) =>
        console.error("[Outbreak Error]:", err),
      );
    }

    await Promise.all([
      this.invalidateCache(),
      cacheHelper.delete(`health:reports-cycle:${payload.cycle_id}`),
      cacheHelper.delete("health:stats"),
    ]);

    return newReport;
  }

  private async handleOutbreakAlert(currentLand: any, disease: any) {
    const loc = currentLand.location as any;
    if (!loc?.latitude || !loc?.longitude) return;

    const otherLands = await cacheHelper.getOrSet(
      "lands:geo-data",
      async () => {
        return await prisma.land.findMany({
          where: { is_active: true },
          select: {
            owner_id: true,
            location: true,
            total_area: true,
            id: true,
          },
        });
      },
      1800,
    );

    const affectedFarmerIds = new Set<string>();
    const OUTBREAK_DANGER_RADIUS = 500;
    const radiusInfected = getRadiusFromArea(currentLand.total_area);

    otherLands.forEach((other: any) => {
      if (other.owner_id === currentLand.owner_id) return;

      const targetLoc = other.location as any;
      if (targetLoc?.latitude && targetLoc?.longitude) {
        const distance = calculateDistance(
          Number(loc.latitude),
          Number(loc.longitude),
          Number(targetLoc.latitude),
          Number(targetLoc.longitude),
        );

        const totalDangerZone =
          radiusInfected +
          getRadiusFromArea(other.total_area) +
          OUTBREAK_DANGER_RADIUS;

        if (distance <= totalDangerZone) affectedFarmerIds.add(other.owner_id);
      }
    });

    if (affectedFarmerIds.size > 0) {
      const farmerIds = Array.from(affectedFarmerIds);

      await prisma.notification.createMany({
        data: farmerIds.map((userId) => ({
          user_id: userId,
          title: `⚠️ Waspada Wabah: ${disease.name}`,
          message: `AI mendeteksi ${disease.name} di lahan sekitar Anda. Segera cek kondisi tanaman Anda.`,
          type: "OUTBREAK_ALERT",
        })),
      });

      const clearNotificationPromises = farmerIds.map((id) =>
        this.invalidateCache({ userId: id }),
      );

      await Promise.all(clearNotificationPromises);
    }
  }

  private async hitMlServer(imageUrl: string): Promise<AIAnalysisResult> {
    try {
      const response = await axios.post(
        AI_ENDPOINT,
        { image_url: imageUrl },
        { timeout: 15000 },
      );

      const rawData = response.data;
      if (!rawData) throw new ApiError(502, "Model ML tidak merespon.");

      const label = rawData.nama_penyakit || rawData.prediction || "unknown";
      const confidence = Number(rawData.confidence) || 0;

      let predictionLabel = label;
      let confidenceScore = confidence;

      if (rawData.predictions?.[0]) {
        predictionLabel =
          rawData.predictions[0].nama_penyakit ||
          rawData.predictions[0].label ||
          label;
        confidenceScore =
          Number(rawData.predictions[0].confidence) || confidence;
      }

      if (predictionLabel === "unknown" || confidenceScore < 0.5) {
        throw new ApiError(
          422,
          "AI tidak mengenali objek. Pastikan foto daun jelas.",
        );
      }

      return {
        isValidPlant: true,
        disease_name: predictionLabel,
        confidence_score: confidenceScore,
        insight: this.parseAIExplanation(rawData.ai_explanation),
        is_dangerous:
          [
            "Mango Anthracnose",
            "Mango Dieback",
            "Tomato Early Blight",
          ].includes(predictionLabel) && confidenceScore > 0.75,
      };
    } catch (error: any) {
      if (axios.isAxiosError(error))
        throw new ApiError(502, "Server AI Gangguan.");
      throw error;
    }
  }

  private parseAIExplanation(explanation: string) {
    const result = {
      disease_description: "",
      causes: "",
      treatment: [] as string[],
      prevention: [] as string[],
      recovery: "",
    };
    if (!explanation) return result;

    const patterns = {
      desc: /Penyakit:\n([\s\S]*?)(?=\n\n(?:Penyebab|Causes):|\n\n(?:Penanganan|Treatment):|$)/i,
      causes:
        /Penyebab:\n([\s\S]*?)(?=\n\n(?:Penanganan|Treatment):|\n\n(?:Pencegahan|Prevention):|$)/i,
      treat:
        /(?:Penanganan|Treatment):\n([\s\S]*?)(?=\n\n(?:Pencegahan|Prevention):|\n\n(?:Pemulihan|Recovery):|$)/i,
      prev: /(?:Pencegahan|Prevention):\n([\s\S]*?)(?=\n\n(?:Pemulihan|Recovery):|$)/i,
      rec: /(?:Pemulihan|Recovery):\n([\s\S]*?)$/i,
    };

    const clean = (match: any) => (match ? match[1].trim() : "");
    const cleanList = (match: any) =>
      match
        ? match[1]
            .split("\n")
            .map((i: string) => i.replace(/^\d+\.\s*/, "").trim())
            .filter(Boolean)
        : [];

    result.disease_description = clean(explanation.match(patterns.desc));
    result.causes = clean(explanation.match(patterns.causes));
    result.treatment = cleanList(explanation.match(patterns.treat));
    result.prevention = cleanList(explanation.match(patterns.prev));
    result.recovery = clean(explanation.match(patterns.rec));

    return result;
  }
}

export const aiModelService = new AiModelService();
