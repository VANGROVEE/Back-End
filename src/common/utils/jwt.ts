import { env } from "@/common/config/env";
import { SignJWT, jwtVerify } from "jose";

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const signJwt = async (payload: JWTPayload): Promise<string> => {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
};

export const verifyJwt = async <T = JWTPayload>(token: string): Promise<T> => {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as T;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
