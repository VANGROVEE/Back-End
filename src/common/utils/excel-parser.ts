import * as XLSX from "xlsx";
import { ApiError } from "./api-error";

export const parseExcelToJson = <T>(
  buffer: Buffer,
  mapFn: (item: any) => T | null,
): T[] => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) throw new ApiError(400, "Sheet Excel tidak ditemukan");

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new ApiError(404, "Worksheet is undefined or empty");
  }
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  if (rawData.length === 0) return [];

  return rawData.map(mapFn).filter((item): item is T => item !== null);
};
