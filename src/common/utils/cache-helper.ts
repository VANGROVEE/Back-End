import redisClient from "../config/redis";

export const getOrSetCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600,
): Promise<T> => {
  const cachedData = await redisClient.get(key);

  if (cachedData) {
    return JSON.parse(cachedData) as T;
  }

  const result = await fetchFn();

  if (result) {
    await redisClient.set(key, JSON.stringify(result), { EX: ttl });
  }

  return result;
};
