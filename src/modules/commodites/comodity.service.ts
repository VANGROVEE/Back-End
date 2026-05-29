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

  private async invalidateExtraCache() {
    await Promise.all([
      cacheHelper.delete(this.COMMODITY_STATS_KEY),
      cacheHelper.delete("commodities:ai-supported"),
      cacheHelper.deletePattern("cycle:ai-check:*"),
    ]);
  }

  async uploadCommodities(buffer: Buffer) {
    // 1. Parsing data dari file Excel / CSV baru
    const parsedData = parseExcelToJson(buffer, (row) => {
      // Validasi kolom wajib (disesuaikan dengan header CSV yang baru dibuat)
      if (
        !row.commodity_name ||
        !row.commodity_slug_ai ||
        !row.commodity_category
      )
        return null;

      return {
        // Data Commodity
        commodity_name: String(row.commodity_name).trim(),
        commodity_slug_ai: String(row.commodity_slug_ai).trim().toLowerCase(),
        commodity_is_ai_supported:
          String(row.commodity_is_ai_supported).toLowerCase() === "true",
        commodity_category: row.commodity_category,

        // Data Disease (bisa kosong untuk beberapa tanaman)
        disease_name: row.disease_name ? String(row.disease_name).trim() : null,
        disease_label_ai: row.disease_label_ai
          ? String(row.disease_label_ai).trim()
          : null,
        disease_scientific_name: row.disease_scientific_name
          ? String(row.disease_scientific_name).trim()
          : null,
        disease_description: row.disease_description
          ? String(row.disease_description).trim()
          : null,
        disease_local_treatment: row.disease_local_treatment
          ? String(row.disease_local_treatment).trim()
          : null,
        disease_preventive_action: row.disease_preventive_action
          ? String(row.disease_preventive_action).trim()
          : null,
      };
    }).filter(Boolean); // Hapus hasil null

    // 2. Ekstrak Komoditas secara Unik (agar tidak duplikat di memori)
    const uniqueCommoditiesMap = new Map();
    for (const item of parsedData) {
      if (!uniqueCommoditiesMap.has(item.commodity_slug_ai)) {
        uniqueCommoditiesMap.set(item.commodity_slug_ai, {
          name: item.commodity_name,
          slug_ai: item.commodity_slug_ai,
          is_ai_supported: item.commodity_is_ai_supported,
          category: item.commodity_category,
        });
      }
    }
    const commoditiesData = Array.from(uniqueCommoditiesMap.values());

    // 3. Simpan Komoditas ke Database
    const commodityResult = await prisma.commodity.createMany({
      data: commoditiesData,
      skipDuplicates: true, // Abaikan jika komoditas (name / slug_ai) sudah ada
    });

    // 4. Ambil ID komoditas dari database untuk direlasikan ke Disease
    // Ambil berdasarkan slug_ai yang ada di file
    const slugs = commoditiesData.map((c) => c.slug_ai);
    const existingCommodities = await prisma.commodity.findMany({
      where: { slug_ai: { in: slugs } },
      select: { id: true, slug_ai: true },
    });

    // Buat map pencarian cepat (slug_ai -> id komoditas)
    const commodityIdMap = new Map(
      existingCommodities.map((c) => [c.slug_ai, c.id]),
    );

    // 5. Persiapkan Data Disease yang memiliki Relasi
    const diseasesData = [];
    for (const item of parsedData) {
      // Lewati jika baris ini tidak punya nama penyakit atau label AI yang valid
      if (!item.disease_name || !item.disease_label_ai) continue;

      const commodity_id = commodityIdMap.get(item.commodity_slug_ai);
      // Lewati jika entah kenapa komoditas tidak ditemukan di DB
      if (!commodity_id) continue;

      diseasesData.push({
        name: item.disease_name,
        label_ai: item.disease_label_ai, // Ini akan menggunakan format unik seperti "tomato_target_spot"
        commodity_id: commodity_id, // Relasi Foreign Key
        scientific_name: item.disease_scientific_name || null,
        description: item.disease_description || null,
        local_treatment: item.disease_local_treatment || null,
        preventive_action: item.disease_preventive_action || null,
      });
    }

    // 6. Simpan Penyakit ke Database
    let diseaseResult = { count: 0 };
    if (diseasesData.length > 0) {
      diseaseResult = await prisma.disease.createMany({
        data: diseasesData,
        skipDuplicates: true, // Menghindari error constraint jika label_ai sudah terdaftar
      });
    }

    // 7. Clear Cache
    await Promise.all([this.invalidateCache(), this.invalidateExtraCache()]);

    // Kembalikan rekap agar di log / response terlihat seberapa banyak data yang masuk
    return {
      success: true,
      commoditiesInserted: commodityResult.count,
      diseasesInserted: diseaseResult.count,
    };
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
              _count: { id: true },
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
          total_commodities: String(totalCommodities),
          total_ai_supported: String(totalAiSupported),
          total_categories: String(groupingByCategory.length),
          categories,
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
