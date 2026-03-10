export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error: string | null;
  path: string;
  method: string;
  timestamp: string;
}
