import pino from "pino";
import { pinoHttp } from "pino-http";

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname,req,res",
      messageFormat: "{msg}",
    },
  },
});
export const httpLogger = pinoHttp({
  logger: logger,

  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },

  customSuccessMessage: (req, res) => {
    return `✅ ${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `❌ ${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
});
