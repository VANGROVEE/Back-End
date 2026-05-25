import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { utapi } from "@/common/lib/uploadthing";
import type { HealthReport } from "@/generated/prisma/client";
// import { analyzeImage } from "../ai-models/ai-model.service";
import type { CreateHealthReportDto } from "./health.dto";

class HealthService extends BaseService<
  HealthReport,
  typeof prisma.healthReport
> {
  constructor() {
    super(prisma.healthReport);
  }
  async createReportWithAI(dto: CreateHealthReportDto) {
    const cycle = await prisma.plantingCycle.findUnique({
      where: { id: dto.cycle_id },
      include: { commodity: true },
    });

    if (!cycle || !cycle.commodity.is_ai_supported) {
      await utapi.deleteFiles(dto.image_key);
      throw new Error("Komoditas ini belum mendukung fitur analisis AI.");
    }
  }
}

export const healthService = new HealthService();
