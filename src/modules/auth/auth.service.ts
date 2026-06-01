import { prisma } from "@/common/config/prisma";
import { supabase } from "@/common/lib/supabase";
import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "@/common/utils/cache";
import type { LoginDto, RegisterAuhtDto, UpdateAuthDto } from "./auth.dto";

export const authService = {
  getMe: async (token: string) => {
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      throw new ApiError(401, "Sesi expired, silakan login ulang");
    }

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
    });

    if (!user) {
      throw new ApiError(404, "User belum terdaftar di database kami");
    }

    return { user, token };
  },

  googleLogin: async (token: string) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new ApiError(
        401,
        `Google login failed: ${error?.message || "Invalid Token"}`,
      );
    }

    const updatedUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        name: user.user_metadata.full_name || user.user_metadata.name,
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata.full_name || user.user_metadata.name,
      },
    });

    return { user: updatedUser, token };
  },
  login: async (payload: LoginDto) => {
    const { email, password } = payload;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new ApiError(401, "Email atau password salah");

    return {
      session: data.session,
      user: data.user,
    };
  },

  register: async (payload: RegisterAuhtDto) => {
    const { email, password, name } = payload;

    // 1. Lakukan pendaftaran ke Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (authError) throw new ApiError(400, authError.message);
    if (!authData.user) throw new ApiError(400, "Registration failed");

    // 2. Sinkronisasi ke Prisma (Gunakan ID dari Supabase)
    // Kita gunakan upsert agar lebih aman jika terjadi race condition dengan trigger/webhook
    const user = await prisma.user.upsert({
      where: { id: authData.user.id },
      update: {
        email,
        name,
      },
      create: {
        id: authData.user.id,
        email,
        name,
        role: "FARMER", // Default role
      },
    });

    // 3. Bersihkan Cache
    await Promise.all([
      cacheHelper.deletePattern("users:all:*"),
      cacheHelper.deletePattern("cache:*users*"),
      cacheHelper.delete("users:stats"),
    ]);

    /**
     * 4. Panggil method login internal atau kembalikan session dari signUp Jika
     *    'Confirm Email' di Supabase OFF, authData.session sudah terisi
     *    otomatis. Jika ON, maka user harus verifikasi dulu (session akan
     *    null).
     */
    if (authData.session) {
      return {
        user,
        session: authData.session,
      };
    }

    // Jika butuh login ulang secara paksa (opsional):
    // return await authService.login({ email, password });

    return { user };
  },

  update: async (currentId: string, payload: UpdateAuthDto) => {
    const { email, name, password } = payload;

    const existingUser = await prisma.user.findUnique({
      where: { id: currentId },
    });

    if (!existingUser)
      throw new ApiError(404, "User tidak ditemukan di database");

    const { data: listData } = await supabase.auth.admin.listUsers();
    const authUser = listData.users.find((u) => u.email === existingUser.email);

    if (!authUser)
      throw new ApiError(404, "User tidak ditemukan di Supabase Auth");

    const { error: authError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      {
        email: email,
        password,
        user_metadata: { full_name: name },
      },
    );

    if (authError) throw new ApiError(400, authError.message);

    const updatedUser = await prisma.user.update({
      where: { id: currentId },
      data: {
        email: email,
        name: name,
      },
    });

    await Promise.all([
      cacheHelper.delete([`users:detail:${currentId}`, "users:stats"]),
      cacheHelper.deletePattern("users:all:*"),
      cacheHelper.deletePattern("cache:*users*"),
    ]);

    return updatedUser;
  },

  delete: async (currentId: string) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: currentId },
    });

    if (!existingUser)
      throw new ApiError(404, "User tidak ditemukan di database");

    const { data: listData } = await supabase.auth.admin.listUsers();
    const targetUser = listData.users.find(
      (u) => u.email === existingUser.email,
    );

    if (!targetUser)
      throw new ApiError(404, "User tidak ditemukan di Supabase Auth");

    const { error: authError } = await supabase.auth.admin.deleteUser(
      targetUser.id,
    );
    if (authError) throw new ApiError(400, authError.message);

    await Promise.all([
      cacheHelper.delete([`users:detail:${currentId}`, "users:stats"]),
      cacheHelper.deletePattern("users:all:*"),
      cacheHelper.deletePattern("cache:*users*"),
    ]);

    return targetUser.id;
  },
};
