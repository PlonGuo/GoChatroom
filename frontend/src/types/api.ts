export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginatedRequest {
  limit?: number;
  offset?: number;
}
