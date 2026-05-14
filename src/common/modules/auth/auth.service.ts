import { prisma } from "@/common/config/prisma";
import { supabase } from "@/common/lib/supabase";

import { ApiError } from "@/common/utils/api-error";
import type { LoginDto, RegisterAuhtDto, UpdateAuthDto } from "./auth.dto";

export const authService = {
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

    const user = await prisma.user.findUnique({
      where: { id: authData.user.id },
    });

    return { user: user || authData.user };
  },
  update: async (currentId: string, payload: UpdateAuthDto) => {
    const { email, name, password } = payload;

    const existingUser = await prisma.user.findUnique({
      where: { id :currentId},
    });

    if (!existingUser)
      throw new ApiError(404, "User tidak ditemukan di database");

    const targetEmail = email || existingUser.email;

    const { data: listData } = await supabase.auth.admin.listUsers();

    const authUser = listData.users.find((u) => u.email === existingUser.email);

    if (!authUser)
      throw new ApiError(404, "User tidak ditemukan di Supabase Auth");

    const { data: authData, error: authError } =
      await supabase.auth.admin.updateUserById(authUser.id, {
        email: email,
        password,
        user_metadata: { full_name: name },
      });

    if (authError) throw new ApiError(400, authError.message);

    const updatedUser = await prisma.user.update({
      where: { id: currentId },
      data: {
        email: email,
        name: name,
      },
    });

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

    const { data: authData, error: authError } =
      await supabase.auth.admin.deleteUser(targetUser.id);
    if (authError) throw new ApiError(400, authError.message);

    return targetUser.id;
  },
};
