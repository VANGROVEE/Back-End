import { registry } from "@/common/docs/openapi-registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const spatialAnalysisResponseSchema = z
  .object({
    lands: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        position: z.array(z.number()).length(2),
        address: z.string(),
        area_ha: z.number(),
        health_status: z.enum(["NORMAL", "KRITIS", "WARNING"]),
        current_commodity: z.string(),
        sensor_data: z.object({
          soil_moisture: z.number(),
          unit: z.string(),
          last_update: z.string().datetime().nullable(),
        }),
        weather: z
          .object({
            temp: z.number(),
            humidity: z.number(),
            condition: z.string(),
            rain_probability: z.number(),
            wind_speed: z.number(),
          })
          .nullable(),
      }),
    ),
    summary: z.object({
      avg_moisture: z.number(),
      critical_lands: z.number(),
      active_commodities: z.array(z.string()),
      rain_forecast_avg: z.number(),
    }),
    last_sync: z.string().datetime(),
  })
  .openapi("SpatialAnalysisResponse");

registry.register("SpatialAnalysisResponse", spatialAnalysisResponseSchema);
