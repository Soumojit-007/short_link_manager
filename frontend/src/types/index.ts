export interface Link {
  id: string;
  slug: string;
  destinationUrl: string;
  clickCap: number | null;
  clickCount: number;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LinkStats {
  date: string; // YYYY-MM-DD
  clicks: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
}
