import { createClient, type RedisClientType } from "redis";
import { env } from "./env";
import { logger } from "./pino";

const redisClient: RedisClientType = createClient({
  url: env.REDIS_URL || "redis://localhost:6379",

  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error("Redis reconnect attempts exceeded 10 times. Stopping...");
        return new Error("Redis connection lost");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("error", (err) => logger.error({ err }, "Redis Client Error"));
redisClient.on("connect", () => logger.info("Redis client connecting..."));
redisClient.on("ready", () =>
  logger.info("Redis client connected and ready to use! ⚡"),
);

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.log("\n" + "=".repeat(50));
    logger.fatal("❌ REDIS CONNECTION ERROR");
    console.log("Mohon pastikan Redis sudah terinstall dan berjalan.");
    console.log(
      "Tips: Jalankan 'docker-compose up -d' atau cek servis redis-server.",
    );
    console.log("=".repeat(50) + "\n");

    process.exit(1);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info("Redis Client Disconnected gracefully");
    }
  } catch (error) {
    logger.error(
      { err: error },
      "Error while disconnecting Redis, forcing disconnect",
    );
    await redisClient.disconnect();
  }
};

export default redisClient;
