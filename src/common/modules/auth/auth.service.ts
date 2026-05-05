import { prisma } from "@/common/config/prisma";
import { supabase } from "@/common/lib/supabase";

import { ApiError } from "@/common/utils/api-error";
import type { LoginDto, RegisterDto } from "./auth.dto";

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

  register: async (payload: RegisterDto) => {
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
};
