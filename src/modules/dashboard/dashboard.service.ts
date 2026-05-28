import { prisma } from "@/common/config/prisma";
import { cacheHelper } from "@/common/utils/cache";
import { weatherUtils } from "@/common/utils/weather";
import { ApiError } from "@/common/utils/api-error";

export class DashboardAnalyzeService {
  private readonly CACHE_PREFIX = "analytics:dashboard";

  async getSpatialAnalysis(userId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:spatial:${userId}`;

    return await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const lands = await prisma.land.findMany({
          where: {
            owner_id: userId,
            is_active: true,
          },
          include: {
            planting_cycles: {
              where: { status: "PLANTING" },
              include: {
                commodity: true,
                daily_activities: {
                  orderBy: { activity_date: "desc" },
                  take: 1,
                },
              },
            },
          },
        });

        if (!lands.length) return { lands: [], global_stats: null };

        const analyzedLands = await Promise.all(
          lands.map(async (land) => {
            const loc = land.location as any;
            const activeCycle = land.planting_cycles[0] || null;
            const lastActivity = activeCycle?.daily_activities[0] || null;

            const weather =
              loc?.latitude && loc?.longitude
                ? await weatherUtils.getTomorrowForecast(
                    Number(loc.latitude),
                    Number(loc.longitude),
                  )
                : null;

            return {
              id: land.id,
              name: land.name,

              position: [Number(loc?.latitude), Number(loc?.longitude)],
              address: loc?.address || "",

              area_ha: parseFloat((land.total_area / 10000).toFixed(2)),

              health_status: this.determineHealthStatus(lastActivity),

              current_commodity: activeCycle?.commodity.name || "Vacant",
              sensor_data: {
                soil_moisture: lastActivity?.amount || 0,
                unit: lastActivity?.unit || "%",
                last_update: lastActivity?.created_at || null,
              },
              weather: weather,

              polygon_coords: loc?.polygon_coords || null,
            };
          }),
        );

        const globalStats = this.calculateGlobalStats(analyzedLands);

        return {
          lands: analyzedLands,
          summary: globalStats,
          last_sync: new Date(),
        };
      },
      900,
    );
  }

  async getHealthAnalysis(userId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:health:${userId}`;

    return await cacheHelper.getOrSet(
      cacheKey,
      async () => {
        const reports = await prisma.healthReport.findMany({
          where: {
            cycle: {
              status: { in: ["PLANTING", "HARVESTED"] },
              land: { owner_id: userId },
            },
          },
          include: {
            cycle: {
              select: {
                id: true,
                start_date: true,
                commodity: { select: { name: true } },
                // Ambil info lahan untuk pengelompokan
                land: {
                  select: { id: true, name: true },
                },
              },
            },
            disease: {
              select: { name: true },
            },
          },
          orderBy: { created_at: "desc" },
          take: 30, // Ditingkatkan sedikit karena mencakup banyak lahan
        });

        // Transformasi: Kategorikan berdasarkan Lahan -> Siklus
        const groupedByLand = reports.reduce((acc: any, report) => {
          const landId = report.cycle.land.id;
          const landName = report.cycle.land.name;

          if (!acc[landId]) {
            acc[landId] = {
              land_name: landName,
              reports: [],
            };
          }

          acc[landId].reports.push({
            id: report.id,
            confidence_score: report.confidence_score,
            gemini_insight: report.gemini_insight,
            is_outbreak_trigger: report.is_outbreak_trigger,
            created_at: report.created_at,
            cycle: {
              id: report.cycle.id,
              commodity_name: report.cycle.commodity.name,
              start_date: report.cycle.start_date,
            },
            disease: report.disease ? { name: report.disease.name } : null,
          });

          return acc;
        }, {});

        // Kembalikan dalam bentuk Array agar mudah di-map di Frontend
        return Object.values(groupedByLand);
      },
      600,
    );
  }

  private determineHealthStatus(
    lastActivity: any,
  ): "NORMAL" | "KRITIS" | "WARNING" {
    if (!lastActivity) return "NORMAL";

    const val = lastActivity.amount;
    if (val < 30) return "KRITIS";
    if (val < 50) return "WARNING";
    return "NORMAL";
  }

  private calculateGlobalStats(analyzedLands: any[]) {
    const totalLands = analyzedLands.length;

    const avgMoisture =
      analyzedLands.reduce(
        (acc, curr) => acc + curr.sensor_data.soil_moisture,
        0,
      ) / totalLands;

    const criticalCount = analyzedLands.filter(
      (l) => l.health_status === "KRITIS",
    ).length;

    return {
      avg_moisture: Math.round(avgMoisture),
      critical_lands: criticalCount,
      active_commodities: [
        ...new Set(analyzedLands.map((l) => l.current_commodity)),
      ].filter((c) => c !== "Vacant"),
      rain_forecast_avg: Math.round(
        analyzedLands.reduce(
          (acc, curr) => acc + (curr.weather?.rain_probability || 0),
          0,
        ) / totalLands,
      ),
    };
  }
}

export const dashboardAnalyzeService = new DashboardAnalyzeService();
