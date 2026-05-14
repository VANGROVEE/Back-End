import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { parseExcelToJson } from "@/common/utils/excel-parser";
import type { Commodity } from "@/generated/prisma/client";

class CommodityService extends BaseService<Commodity, typeof prisma.commodity> {
  constructor() {
    super(prisma.commodity);
  }

  async uploadCommodities(buffer: Buffer) {
    const commodities = parseExcelToJson(buffer, (row) => {
      if (!row.name || !row.slug_ai || !row.category) return null;

      return {
        name: String(row.name).trim(),
        slug_ai: String(row.slug_ai).trim().toLowerCase(),
        is_ai_supported: String(row.is_ai_supported).toLowerCase() === "true",
        category: row.category,
      };
    });

    return await prisma.commodity.createMany({
      data: commodities,
      skipDuplicates: true,
    });
  }

  async getStats() {
    const [totalCommodities, totalAiSupported, groupingByCategory] =
      await Promise.all([
        prisma.commodity.count(),

        prisma.commodity.count({
          where: { is_ai_supported: true },
        }),

        prisma.commodity.groupBy({
          by: ["category"],
          _count: {
            id: true,
          },
        }),
      ]);

    return {
      total_commodities: totalCommodities,
      total_ai_supported: totalAiSupported,

      categories: groupingByCategory.reduce(
        (acc, curr) => {
          acc[curr.category] = curr._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),

      total_categories: groupingByCategory.length,
    };
  }
}

export const commodityService = new CommodityService();
