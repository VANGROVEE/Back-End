import axios from "axios";
import { env } from "../config/env";

export interface ForecastData {
  temp: number;
  humidity: number;
  condition: string;
  rain_probability: number;
  wind_speed: number;
}

export const weatherUtils = {
  async getTomorrowForecast(
    lat: number,
    lon: number,
  ): Promise<ForecastData | null> {
    try {
      const apiKey = env.OPENWEATHER_API_KEY;
      const baseUrl = env.OPENWEATHER_BASE_URL;

      if (!apiKey || !baseUrl) {
        console.warn(
          "⚠️ Konfigurasi OpenWeather (API Key/URL) tidak lengkap di .env.",
        );
        return null;
      }

      const { data } = await axios.get(baseUrl, {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: "metric",
          lang: "id",
        },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateString = tomorrow.toISOString().split("T")[0];

      const tomorrowForecasts = data.list.filter((item: any) =>
        item.dt_txt.startsWith(tomorrowDateString),
      );

      if (tomorrowForecasts.length === 0) return null;

      const maxPop = Math.max(
        ...tomorrowForecasts.map((item: any) => item.pop || 0),
      );

      const noonForecast =
        tomorrowForecasts.find((item: any) =>
          item.dt_txt.includes("12:00:00"),
        ) || tomorrowForecasts[0];

      return {
        temp: noonForecast.main.temp,
        humidity: noonForecast.main.humidity,
        condition: noonForecast.weather[0].description,
        rain_probability: Math.round(maxPop * 100),
        wind_speed: noonForecast.wind.speed,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "❌ OpenWeather API Error:",
          error.response?.data || error.message,
        );
      } else {
        console.error("❌ Unexpected Error:", error);
      }
      return null;
    }
  },
};
