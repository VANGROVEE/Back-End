import type { NextFunction, Request, Response } from "express";
import redisClient from "../config/redis";
import { sendResponse } from "./response";

export const cacheHelper = {
  getOrSet: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> => {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached) as T;

    const freshData = await fetchFn();
    if (freshData) {
      await redisClient.set(key, JSON.stringify(freshData), { EX: ttl });
    }
    return freshData;
  },

  delete: async (key: string | string[]) => {
    if (Array.isArray(key)) {
      for (const k of key) await redisClient.del(k);
    } else {
      await redisClient.del(key);
    }
  },

  deletePattern: async (pattern: string) => {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(keys);
  },
};

// src/common/middlewares/auto-cache.ts
export const autoCache = (
  duration: number = 3600,
  isPrivate: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const userId = (req as any).user?.id;
    const cacheKey =
      isPrivate && userId
        ? `cache:${req.originalUrl}:${userId}`
        : `cache:${req.originalUrl}`;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return sendResponse(
          res,
          200,
          "Success (Cached)",
          JSON.parse(cachedData),
          true,
        );
      }

      const originalJson = res.json;
      res.json = (body) => {
        if (res.statusCode === 200) {
          redisClient.set(cacheKey, JSON.stringify(body), { EX: duration });
        }
        return originalJson.call(res, body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};
