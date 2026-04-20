import { app } from "./src/common/config/app";
import { env } from "@config/env";
import { logger } from "@config/pino";
import chalk from "chalk";

const PORT = env.PORT;
const HOST = env.HOST;

try {
  const server = app.listen(PORT, HOST, () => {
    const displayHost =
      HOST === "0.0.0.0" || HOST === "localhost" ? "localhost" : HOST;
    const url = `http://${displayHost}:${PORT}/api/v1`;

    console.clear();

    logger.info(`Server started successfully on ${url}`);

    console.log(`
${chalk.bold.green("  🚀 MANGROVE BACKEND DEPLOYED")}
${chalk.gray("  ---------------------------------------------")}
  ${chalk.blue("➜")}  ${chalk.bold("Local:")}   ${chalk.cyan(url)}
  ${chalk.blue("➜")}  ${chalk.bold("Docs:")}    ${chalk.cyan(`${url}/docs`)}
  ${chalk.blue("➜")}  ${chalk.bold("Health:")}  ${chalk.cyan(`${url}/health`)}
${chalk.gray("  ---------------------------------------------")}
    `);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use by another application.`);
    } else {
      logger.error(`Server Error: ${err.message}`);
    }
    process.exit(1);
  });

  const shutdown = () => {
    console.log(
      chalk.yellow("\n🛑 Shutdown signal received. Closing server..."),
    );
    server.close(() => {
      logger.info("Server closed. Bye!");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error(chalk.red("💥 Fatal Error during startup:"), error);
  process.exit(1);
}
