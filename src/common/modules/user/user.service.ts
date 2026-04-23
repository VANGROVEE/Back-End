import { BaseService } from "@/common/base/service";
import { prisma } from "@/common/config/prisma";
import type { Prisma, User } from "@/generated/prisma/client";

class UserService extends BaseService<User, typeof prisma.user> {
  public readonly userUpdateSelect: Prisma.UserSelect = {
    id: true,
    name: true,
  };

  public readonly userAdminSelect: Prisma.UserSelect = {
    id: true,
    name: true,
    _count: {
      select: { lands: true }, // Menghitung jumlah lahan tanpa menarik semua datanya
    },
    auth_credentials: {
      select: { email: true, role: true }, // Mengambil email dari tabel sebelah
    },
  };
  constructor() {
    super(prisma.user);
  }
}

export const userServices = new UserService();
