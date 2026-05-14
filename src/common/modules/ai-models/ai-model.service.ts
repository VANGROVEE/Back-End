// export interface AIAnalysisResult {
//   isValidPlant: boolean;
//   disease_id?: string;
//   confidence_score: number;
//   insight: any;
//   is_dangerous: boolean;
// }

// const AI_ENDPOINT =
//   process.env.AI_MODEL_ENDPOINT || "http://localhost:5000/predict";

// export const analyzeImage = async (
//   imageUrl: string,
// ): Promise<AIAnalysisResult> => {
//   try {

//     const response = await fetch(AI_ENDPOINT, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         image_url: imageUrl,
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`[AI Service] Error dari server AI:`, errorText);
//       throw new Error(`AI Server Error: ${response.status}`);
//     }

//     const rawData = await response.json();

//     const result: AIAnalysisResult = {
//       isValidPlant: Boolean(rawData.is_valid_plant),
//       disease_id: rawData.disease_id || null,
//       confidence_score: Number(rawData.confidence_score) || 0,
//       insight: rawData.insight || "Tidak ada catatan tambahan dari AI.",
//       is_dangerous: Boolean(rawData.is_outbreak_risk),
//     };

//     return result;
//   } catch (error: any) {
//     console.error("[AI Service] Gagal menghubungi Model AI:", error.message);
//     throw new Error(
//       "Gagal menganalisis gambar. Layanan AI tidak merespon dengan baik.",
//     );
//   }
// };
