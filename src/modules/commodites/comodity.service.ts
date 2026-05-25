import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { cacheHelper } from "@/common/utils/cache";
import { parseExcelToJson } from "@/common/utils/excel-parser";
import type { Commodity } from "@/generated/prisma/client";

class CommodityService extends BaseService<Commodity, typeof prisma.commodity> {
  private readonly COMMODITY_STATS_KEY = "commodities:stats";

  constructor() {
    super(prisma.commodity, "commodities");
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

    const result = await prisma.commodity.createMany({
      data: commodities,
      skipDuplicates: true,
    });

    await this.invalidateCache();
    await cacheHelper.delete(this.COMMODITY_STATS_KEY);

    await cacheHelper.deletePattern("cycle:ai-check:*");

    return result;
  }

  async getStats() {
    return cacheHelper.getOrSet(
      this.COMMODITY_STATS_KEY,
      async () => {
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

        const categories = groupingByCategory.reduce(
          (acc, curr) => {
            acc[curr.category] = curr._count.id;
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          total_commodities: totalCommodities,
          total_ai_supported: totalAiSupported,
          categories,
          total_categories: groupingByCategory.length,
        };
      },
      86400,
    );
  }

  async getAiSupported() {
    return cacheHelper.getOrSet("commodities:ai-supported", async () => {
      return await prisma.commodity.findMany({
        where: { is_ai_supported: true },
      });
    });
  }
}

export const commodityService = new CommodityService();
