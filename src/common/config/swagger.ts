import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

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
        url: `http://localhost:${process.env.PORT || 8000}`,
        description: "Development Server",
      },
    ],
  },

  apis: ["./src/routes/*.ts", "./src/app.ts"],
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

  console.log("📝 [Swagger]: Documentation ready at /docs");
};
