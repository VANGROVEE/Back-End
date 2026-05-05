import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import type { Prisma, User } from "@/generated/prisma/client";

class UserService extends BaseService<User, typeof prisma.user> {
  public readonly userUpdateSelect: Prisma.UserSelect = {
    id: true,
    name: true,
  };

  public readonly userAdminSelect: Prisma.UserSelect = {
    _count: {
      select: { lands: true },
    },
  };
  constructor() {
    super(prisma.user);
  }
}

export const userServices = new UserService();
