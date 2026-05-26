import { app } from "@/common/config/app";
import { env } from "@/common/config/env";
import { logger } from "@/common/config/pino";
import { prisma } from "@/common/config/prisma";
import { connectRedis, disconnectRedis } from "@/common/config/redis";
import chalk from "chalk";

const { PORT, HOST, NODE_ENV } = env;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connection established");

    await connectRedis();

    const server = app.listen(PORT, HOST, () => {
      if (NODE_ENV === "development") {
        const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
        const url = `http://${displayHost}:${PORT}/api/v1`;

        console.clear();
        console.log(`
        ${chalk.bold.green("   🚀 VANGROVE BACKEND DEPLOYED")}
        ${chalk.gray("   ---------------------------------------------")}
          ${chalk.blue("➜")}   ${chalk.bold("Local:")}    ${chalk.cyan(url)}
          ${chalk.blue("➜")}   ${chalk.bold("Docs:")}     ${chalk.cyan(`${url}/docs`)}
          ${chalk.blue("➜")}   ${chalk.bold("Mode:")}     ${chalk.yellow(NODE_ENV)}
        ${chalk.gray("   ---------------------------------------------")}
        `);
      } else {
        // Di production (Railway), biarkan log mencetak HOST yang sebenarnya (0.0.0.0)
        logger.info(
          `Server started on http://${HOST}:${PORT}/api/v1 [${NODE_ENV}]`,
        );
      }
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use.`);
      } else {
        logger.error(`Server Error: ${err.message}`);
      }
      process.exit(1);
    });

    const shutdown = async (signal: string) => {
      console.log(chalk.yellow(`\n🛑 ${signal} received. Cleaning up...`));

      const forceExit = setTimeout(() => {
        logger.warn(
          "Could not close connections in time, forcefully shutting down",
        );
        process.exit(1);
      }, 10000);

      server.close(async () => {
        try {
          await disconnectRedis();
          await prisma.$disconnect();
          logger.info("Cleanup successful. Server closed.");
          clearTimeout(forceExit);
          process.exit(0);
        } catch (err) {
          logger.error({ err }, "Error during cleanup");
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    logger.fatal({ err: error }, "💥 Fatal Error during startup");
    process.exit(1);
  }
}

bootstrap();
