import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { logger } from "../config/pino";
import redisClient from "../config/redis";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  handler: (req, res) => {
    logger.warn({ ip: req.ip, url: req.originalUrl }, "Rate limit exceeded");
    res.status(429).json({
      success: false,
      message: "Terlalu banyak permintaan, silakan coba lagi nanti.",
    });
  },
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Aksi terlalu sering, akun Anda diamankan sementara.",
    });
  },
});
