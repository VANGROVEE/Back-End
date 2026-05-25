import type { NextFunction, Request, Response } from "express";
import redisClient from "../config/redis";

export const cacheHelper = {
  getOrSet: async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> => {
    const cached = await redisClient.get(String(key));
    if (cached) return JSON.parse(cached) as T;

    const freshData = await fetchFn();

    if (freshData !== undefined && freshData !== null) {
      await redisClient.set(String(key), JSON.stringify(freshData), {
        EX: ttl,
      });
    }

    return freshData;
  },

  delete: async (key: string | string[]) => {
    const keys = Array.isArray(key) ? key.map(String) : [String(key)];
    if (keys.length > 0) await redisClient.del(keys);
  },

  deletePattern: async (pattern: string) => {
    let cursor = 0;

    do {
      const reply = await redisClient.scan(String(cursor), {
        MATCH: String(pattern),
        COUNT: 100,
      });

      cursor = Number(reply.cursor);

      const keys = reply.keys;
      if (keys && keys.length > 0) {
        await redisClient.del(keys);
      }
    } while (cursor !== 0);
  },
};

export const autoCache = (
  duration: number = 3600,
  isPrivate: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

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
      res.json = function (body) {
        if (res.statusCode === 200 && body) {
          redisClient
            .set(cacheKey, JSON.stringify(body), { EX: duration })
            .catch((err) => console.error(err));
        }
        return originalJson.call(this, body);
      };

      res.setHeader("X-Cache", "MISS");
      next();
    } catch (error) {
      next();
    }
  };
};
