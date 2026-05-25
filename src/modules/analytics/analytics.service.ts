import { prisma } from "@/common/config/prisma";
import { cacheHelper } from "@/common/utils/cache";
import { ROLE } from "@/generated/prisma/enums";
import { startOfMonth, subMonths } from "date-fns";

export const analyticsService = {
  CACHE_KEY_USERS: "analytics:users-active",
  CACHE_KEY_AI: "analytics:ai-performance",

  usersActive: async () => {
    return cacheHelper.getOrSet(
      analyticsService.CACHE_KEY_USERS,
      async () => {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));

        const [totalFarmers, newFarmersThisMonth, newFarmersLastMonth] =
          await Promise.all([
            prisma.user.count({
              where: { role: ROLE.FARMER },
            }),
            prisma.user.count({
              where: {
                role: ROLE.FARMER,
                created_at: { gte: currentMonthStart },
              },
            }),
            prisma.user.count({
              where: {
                role: ROLE.FARMER,
                created_at: {
                  gte: lastMonthStart,
                  lt: currentMonthStart,
                },
              },
            }),
          ]);

        let increase = "0%";
        if (newFarmersLastMonth > 0) {
          const diff =
            ((newFarmersThisMonth - newFarmersLastMonth) /
              newFarmersLastMonth) *
            100;
          increase = `${diff > 0 ? "+" : ""}${Math.round(diff)}%`;
        } else if (newFarmersThisMonth > 0) {
          increase = "+100%";
        }

        return {
          value: totalFarmers.toLocaleString(),
          label: "PENGGUNA AKTIF",
          increase: increase,
        };
      },
      3600,
    );
  },

  aiPerformance: async () => {
    return cacheHelper.getOrSet(
      analyticsService.CACHE_KEY_AI,
      async () => {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);

        const [totalRequests, requestsThisMonth] = await Promise.all([
          prisma.aiRecommendationLog.count(),
          prisma.aiRecommendationLog.count({
            where: { created_at: { gte: currentMonthStart } },
          }),
        ]);

        const status = requestsThisMonth > 0 ? "99.9% Online" : "System Idle";

        return {
          value: totalRequests.toLocaleString(),
          label: "TOTAL REKOMENDASI AI",
          status: status,
        };
      },
      1800,
    );
  },

  invalidateAnalytics: async () => {
    await cacheHelper.delete([
      analyticsService.CACHE_KEY_USERS,
      analyticsService.CACHE_KEY_AI,
    ]);
  },
};
