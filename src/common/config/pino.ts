import pino from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",

  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
          messageFormat: "{msg}",
        },
      }
    : undefined,
});

export const httpLogger = pinoHttp({
  logger,

  customSuccessMessage: (req, res, responseTime) => {
    return `✅ ${req.method} ${req.url} ${res.statusCode} (${responseTime}ms)`;
  },
  customErrorMessage: (req, res, err) => {
    return `❌ ${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },

  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
