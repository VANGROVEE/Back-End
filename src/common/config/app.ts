import cors from "cors";
import "dotenv/config";
import express, { type Express } from "express";
import helmet from "helmet";

import router from "@/routes";
import { globalErrorHandler } from "../middlewares/global-error-handler";
import { notFoundHandler } from "../middlewares/notFound";
import { httpLogger } from "./pino";
import { setupSwagger } from "./swagger";

export const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(httpLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

setupSwagger(app);

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(globalErrorHandler);

