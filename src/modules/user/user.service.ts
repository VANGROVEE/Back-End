import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import { cacheHelper } from "@/common/utils/cache";
import type { Prisma, User } from "@/generated/prisma/client";
import { authService } from "../auth/auth.service";
import type { CreateUserDto, UpdateUserDto } from "./user.dto";

class UserService extends BaseService<User, typeof prisma.user> {
  private readonly STATS_KEY = "users:stats";

  public readonly userUpdateSelect: Prisma.UserSelect = {
    id: true,
    name: true,
  };

  public readonly userAdminSelect: Prisma.UserSelect = {
    id: true,
    name: true,
    nickname: true,
    avatar_url: true,
    phone_number: true,
    bio: true,
    address_home: true,
    fcm_token: true,
    email: true,
    role: true,
    created_at: true,
    _count: true,
  };

  public readonly userAdminFindDetail: Prisma.UserSelect = {
    id: true,
    name: true,
    nickname: true,
    email: true,
    phone_number: true,
    avatar_url: true,
    bio: true,
    address_home: true,
    role: true,
    created_at: true,
    lands: {
      select: {
        id: true,
        name: true,
        total_area: true,
        location: true,
        created_at: true,
      },
    },
    _count: { select: { lands: true } },
  };

  constructor() {
    super(prisma.user, "users");
  }

  async getStats() {
    return cacheHelper.getOrSet(
      this.STATS_KEY,
      async () => {
        const now = new Date();
        const firstDayThisMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [
          totalUsers,
          lastMonthUsers,
          totalArea,
          lastQuarterArea,
          activeToday,
          pendingDocs,
        ] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({
            where: { created_at: { lt: firstDayThisMonth } },
          }),
          prisma.land.aggregate({ _sum: { total_area: true } }),
          prisma.land.aggregate({
            where: {
              created_at: {
                lt: new Date(new Date().setMonth(now.getMonth() - 3)),
              },
            },
            _sum: { total_area: true },
          }),
          prisma.user.count({
            where: {
              lands: {
                some: {
                  planting_cycles: {
                    some: {
                      daily_activities: {
                        some: { created_at: { gte: today } },
                      },
                    },
                  },
                },
              },
            },
          }),
          prisma.user.count({
            where: { lands: { every: { land_certificate_url: null } } },
          }),
        ]);

        const currentAreaSum = totalArea._sum.total_area || 0;
        const lastAreaSum = lastQuarterArea._sum.total_area || 0;
        const avgArea = totalUsers > 0 ? currentAreaSum / totalUsers : 0;
        const lastAvgArea =
          lastMonthUsers > 0 ? lastAreaSum / lastMonthUsers : 0;

        const userGrowth =
          lastMonthUsers > 0
            ? ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100
            : 100;

        return {
          totalUsers: {
            value: String(totalUsers),
            growth: userGrowth.toFixed(0),
            label: "bulan ini",
          },
          avgArea: {
            value: avgArea.toFixed(1),
            diff: (avgArea - lastAvgArea).toFixed(1),
            label: "dari kuartal lalu",
          },
          dataDiscipline: {
            value:
              totalUsers > 0
                ? String(Math.round((activeToday / totalUsers) * 100))
                : "0",
            status: activeToday / totalUsers > 0.7 ? "High" : "Low",
          },
          documents: {
            pending: String(pendingDocs),
            label: "Sertifikat belum diunggah",
          },
        };
      },
      3600,
    );
  }

  private async invalidateAllUserCache(id?: string) {
    await Promise.all([
      this.invalidateCache({ id }),
      cacheHelper.delete(this.STATS_KEY),
    ]);
  }

  async createViaAdmin(
    payload: CreateUserDto,
    args?: Omit<Prisma.UserCreateArgs, "data">,
  ) {
    const newUser = await authService.register({
      email: payload.email as string,
      name: payload.name as string,
      password: "user123",
    });

    let result = newUser.user;

    if (payload.phone_number || payload.address_home || payload.nickname) {
      result = await prisma.user.update({
        where: { id: newUser.user.id },
        data: {
          phone_number: payload.phone_number,
          address_home: payload.address_home,
          nickname: payload.nickname,
          bio: payload.bio,
          avatar_url: payload.avatar_url,
        },
        ...args,
      });
    }

    await this.invalidateAllUserCache();
    return result;
  }

  async updateViaAdmin(id: string, payload: UpdateUserDto) {
    const authUpdate = await authService.update(id, {
      email: payload.email,
      password: payload.password,
    });

    const result = await prisma.user.update({
      where: { id: authUpdate.id },
      data: {
        name: payload.name,
        phone_number: payload.phone_number,
        address_home: payload.address_home,
        nickname: payload.nickname,
        bio: payload.bio,
        avatar_url: payload.avatar_url,
        role: payload.role,
      },
    });

    await this.invalidateAllUserCache(id);
    return result;
  }

  async deleteViaAdmin(id: string) {
    await authService.delete(id);
    await prisma.user.delete({ where: { id } });

    await this.invalidateAllUserCache(id);
    return id;
  }
}

export const userServices = new UserService();
