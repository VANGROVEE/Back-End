import type { NextFunction, Request, Response } from "express";
import redisClient from "../config/redis";

export const cacheHelper = {
  getOrSet: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> => {
    const safeKey = String(key);

    const cached = await redisClient.get(safeKey);
    if (cached) return JSON.parse(cached) as T;

    const freshData = await fetchFn();

    if (freshData !== undefined && freshData !== null) {
      await redisClient.set(safeKey, JSON.stringify(freshData), { EX: ttl });
    }

    return freshData;
  },

  delete: async (key: string | string[]) => {
    if (Array.isArray(key)) {
      if (key.length === 0) return;

      const safeKeys = key.map((k) => String(k));
      await redisClient.del(safeKeys);
    } else {
      await redisClient.del(String(key));
    }
  },

  deletePattern: async (pattern: string) => {
    const keys = await redisClient.keys(String(pattern));
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  },
  invalidateModule: async (moduleName: string) => {
    const pattern = `cache:*${moduleName}*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(
        `[Cache] Invalidated ${keys.length} keys for module: ${moduleName}`,
      );
    }
  },
};

export const autoCache = (
  duration: number = 3600,
  isPrivate: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const userId = (req as any).user?.id || (req as any).user?.sub;
    const cacheKey =
      isPrivate && userId
        ? `cache:${req.originalUrl}:${userId}`
        : `cache:${req.originalUrl}`;

    try {
      const forceRefresh = req.headers["cache-control"] === "no-cache";

      const cachedData = await redisClient.get(cacheKey);

      if (cachedData && !forceRefresh) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", "application/json");
        return res.send(cachedData);
      }

      const originalJson = res.json;
      res.json = (body) => {
        if (res.statusCode === 200 && body) {
          const stringifiedBody = JSON.stringify(body);
          redisClient
            .set(cacheKey, stringifiedBody, { EX: duration })
            .catch((err) => console.error("Redis Cache Set Error:", err));
        }

        res.json = originalJson;
        return res.json(body);
      };

      res.setHeader("X-Cache", "MISS");
      next();
    } catch (error) {
      next();
    }
  };
};
