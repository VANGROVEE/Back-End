import cors from "cors";
import "dotenv/config";
import express, { type Express } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import router from "@/routes";
import { globalErrorHandler } from "../middlewares/global-error-handler";
import { notFoundHandler } from "../middlewares/notFound";
import { httpLogger } from "./pino";
import { setupSwagger } from "./swagger";
import { globalLimiter } from "../middlewares/rate-limiter";
import { rootHandler } from "@/modules/root";

export const app: Express = express();
app.use(helmet());
app.use(
  cors({
    origin: ["https://vangrove.vercel.app", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(httpLogger);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

setupSwagger(app);
app.use("/", rootHandler);
app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(globalErrorHandler);
