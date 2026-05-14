import { prisma } from "@/common/config/prisma";
import { ROLE } from "@/generated/prisma/enums";
import { startOfMonth, subMonths } from "date-fns";

export const analyticsService = {
  usersActive: async () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    const totalFarmers = await prisma.user.count({
      where: { role: ROLE.FARMER },
    });

    const newFarmersThisMonth = await prisma.user.count({
      where: {
        role: ROLE.FARMER,
        created_at: { gte: currentMonthStart },
      },
    });

    const newFarmersLastMonth = await prisma.user.count({
      where: {
        role: ROLE.FARMER,
        created_at: {
          gte: lastMonthStart,
          lt: currentMonthStart,
        },
      },
    });

    let increase = "0%";
    if (newFarmersLastMonth > 0) {
      const diff =
        ((newFarmersThisMonth - newFarmersLastMonth) / newFarmersLastMonth) *
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

  aiPerformance: async () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);

    const totalRequests = await prisma.aiRecommendationLog.count();

    const requestsThisMonth = await prisma.aiRecommendationLog.count({
      where: { created_at: { gte: currentMonthStart } },
    });

    const status = requestsThisMonth > 0 ? "99.9% Online" : "System Idle";

    return {
      value: totalRequests.toLocaleString(),
      label: "TOTAL REKOMENDASI AI",
      status: status,
    };
  },
};
