import { prisma } from "@/common/config/prisma";
import { supabase } from "@/common/lib/supabase";
import { signJwt } from "@/common/utils/jwt";
import { ROLE } from "@/generated/prisma/enums";
import bcrypt from "bcrypt";

import { ApiError } from "@/common/utils/api-error";
import type { LoginDto, RegisterDto } from "./auth.dto";

export const authService = {
  authenticateGoogleUser: async (token: string) => {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new ApiError(401, "Sesi Google tidak valid atau telah kadaluwarsa");
    }

    const { email, user_metadata } = data.user;
    if (!email) throw new ApiError(400, "Gagal mendapatkan email dari Google");

    const account = await prisma.authCredential.upsert({
      where: { email },
      update: {
        user: {
          update: {
            avatar_url: user_metadata.avatar_url ?? "",
            name: user_metadata.full_name ?? "User Vangrove",
          },
        },
      },
      create: {
        email,
        user: {
          create: {
            name: user_metadata.full_name ?? "User Vangrove",
            avatar_url: user_metadata.avatar_url ?? "",
            role: ROLE.FARMER,
          },
        },
      },

      include: { user: true },
    });

    const jwtPayload = {
      sub: account.user.id,
      name: account.user.name,
      email: account.email,
      role: account.user.role,
    };

    const accessToken = await signJwt(jwtPayload);

    return {
      token: accessToken,
      user: jwtPayload,
    };
  },

  login: async (payload: LoginDto) => {
    const { email, password } = payload;

    const account = await prisma.authCredential.findUnique({
      where: { email },
      select: {
        email: true,
        password_hash: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!account) {
      throw new ApiError(401, "Email atau password yang Anda masukkan salah");
    }

    if (!account.password_hash) {
      throw new ApiError(
        400,
        "Akun ini terdaftar melalui Google. Silakan masuk menggunakan akun Google Anda.",
      );
    }

    const isCorrect = await bcrypt.compare(password, account.password_hash);
    if (!isCorrect) {
      throw new ApiError(401, "Email atau password yang Anda masukkan salah");
    }

    const jwtPayload = {
      sub: account.user.id,
      name: account.user.name,
      email: account.email,
      role: account.user.role,
    };

    const token = await signJwt(jwtPayload);

    return {
      token,
      user: {
        id: account.user.id,
        name: account.user.name,
        email: account.email,
        role: account.user.role,
      },
    };
  },

  register: async (payload: RegisterDto) => {
    const { email, password, name } = payload;

    const existingAccount = await prisma.authCredential.findUnique({
      where: { email },
    });

    if (existingAccount) {
      throw new ApiError(
        409,
        "Email sudah terdaftar, silakan gunakan email lain",
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAccount = await prisma.authCredential.create({
      data: {
        email,
        password_hash: passwordHash,
        user: {
          create: {
            name,
            role: ROLE.FARMER,
          },
        },
      },
      include: { user: true },
    });

    const jwtPayload = {
      sub: newAccount.user.id,
      name: newAccount.user.name,
      email: newAccount.email,
      role: newAccount.user.role,
    };

    const token = await signJwt(jwtPayload);

    return { token, user: jwtPayload };
  },
};
