import type { NextFunction, Request, Response } from "express";
import redisClient from "../config/redis";

export const cacheMiddleware = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedBody = await redisClient.get(key);
      if (cachedBody) {
        return res.status(200).json(JSON.parse(cachedBody));
      }

      const originalSend = res.json;
      res.json = (body) => {
        redisClient.set(key, JSON.stringify(body), { EX: duration });
        return originalSend.call(res, body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};
