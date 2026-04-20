export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  detail?: string;
}
