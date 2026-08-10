import type{ Link, LinkStats, PaginatedResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    // Some endpoints might return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  getLinks(page = 1, limit = 10, search = '') {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search ? { search } : {}),
    });
    return this.request<PaginatedResponse<Link>>(`/links?${query}`);
  }

  getLink(id: string) {
    return this.request<Link>(`/links/${id}`);
  }

  createLink(data: { destinationUrl: string; slug?: string; clickCap?: number }) {
    return this.request<Link>('/links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  disableLink(id: string) {
    return this.request<Link>(`/links/${id}/disable`, { method: 'PATCH' });
  }

  deleteLink(id: string) {
    return this.request<void>(`/links/${id}`, { method: 'DELETE' });
  }

  getLinkStats(id: string) {
    return this.request<LinkStats[]>(`/links/${id}/stats`);
  }

  suggestSlugs(destinationUrl: string) {
    return this.request<{ suggestions: string[] }>('/links/suggest-slugs', {
      method: 'POST',
      body: JSON.stringify({ destinationUrl }),
    });
  }
}

export const api = new ApiClient();
