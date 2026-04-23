import type { Express } from "express";
import merge from "lodash/merge"; // Install jika belum: bun add lodash && bun add -d @types/lodash
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocs } from "../docs/openapi-generator";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mangrove Project API",
      version: "1.0.0",
      description: "API Documentation for Mangrove Capstone Project",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8000}/api/v1`,
        description: "Development Server",
      },
    ],
  },
  // Tetap baca file .ts untuk mengambil komentar @openapi di Controller/Route
  apis: [],
};

// 1. Ambil spesifikasi dari komentar manual JSDoc
const jscdocSpecs = swaggerJSDoc(options);

// 2. Ambil spesifikasi otomatis dari Zod Registry
const zodSpecs = generateOpenApiDocs();

// 3. MERGE keduanya (Zod Specs akan mengisi bagian 'components' secara otomatis)
const finalDocs = merge(jscdocSpecs, zodSpecs);

export const setupSwagger = (app: Express): void => {
  // Gunakan finalDocs hasil gabungan
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(finalDocs));

  console.log("📝 [Swagger]: Documentation ready at /docs");
};
