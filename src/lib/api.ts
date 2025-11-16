import { config } from '../config/constants';
import { supabase } from './supabase';
import type {
  CitiesResponse,
  CityDetailResponse,
  NearbyResponse,
  NearbyUnifiedResponse,
  RecentTipsResponse,
  FeaturedTipsResponse,
  SearchTipsResponse,
  SubmitTipRequest,
  SubmitTipResponse,
  SubmitPinRequest,
  SubmitPinResponse,
  NotificationsResponse,
  WaitlistCountResponse,
} from '../types';

class ApiClient {
  public baseUrl: string;
  private requestCache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION = 60000; // 1 minute

  constructor() {
    this.baseUrl = config.apiUrl;
    this.requestCache = new Map();
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return headers;
  }

  private getCacheKey(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  public clearCache(): void {
    this.requestCache.clear();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { useCache?: boolean } = {}
  ): Promise<T> {
    const { useCache = false, ...fetchOptions } = options;
    const cacheKey = this.getCacheKey(endpoint);

    // Check cache for GET requests
    if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...(fetchOptions.headers || {}),
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Cache successful GET requests
      if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
        this.setCache(cacheKey, data);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  // 1. Get All Cities
  async getCities(): Promise<CitiesResponse> {
    return this.request<CitiesResponse>('/cities', { useCache: true });
  }

  // 2. Get City Details
  async getCity(slug: string): Promise<CityDetailResponse> {
    return this.request<CityDetailResponse>(`/city/${slug}`, { useCache: true });
  }

  // 3. Get Nearby Safety Data (Live Mode) - Legacy
  async getNearby(lat: number, lng: number, cityId?: number): Promise<NearbyResponse> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    if (cityId) {
      params.append('cityId', cityId.toString());
    }
    return this.request<NearbyResponse>(`/live/nearby?${params.toString()}`);
  }

  // 4. Get Nearby Pins and Tips (Unified - Primary Method)
  async getNearbyPinsAndTips(
    lat: number,
    lng: number,
    options?: { 
      radius?: number; 
      include?: 'pins' | 'tips' | 'pins,tips'; 
      limit?: number;
    }
  ): Promise<NearbyUnifiedResponse> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    
    // Set defaults
    const radius = options?.radius ?? 1000;
    const include = options?.include ?? 'pins,tips';
    const limit = options?.limit ?? 200;

    params.append('radius', String(radius));
    params.append('include', include);
    params.append('limit', String(limit));

    return this.request<NearbyUnifiedResponse>(`/nearby?${params.toString()}`);
  }

  // 5. Get Recent Tips
  async getRecentTips(limit: number = 5): Promise<RecentTipsResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    return this.request<RecentTipsResponse>(
      `/recent-tips${limit ? `?${params.toString()}` : ''}`,
      { useCache: true }
    );
  }

  // 6. Get Featured Tips (NEW)
  async getFeaturedTips(limit: number = 20): Promise<FeaturedTipsResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    return this.request<FeaturedTipsResponse>(
      `/featured-tips?${params.toString()}`,
      { useCache: true }
    );
  }

  // 7. Search Tips
  async searchTips(query: string): Promise<SearchTipsResponse> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }
    const params = new URLSearchParams({ q: query.trim() });
    return this.request<SearchTipsResponse>(`/search-tips?${params.toString()}`);
  }

  // 8. Submit Safety Tip
  async submitTip(data: SubmitTipRequest): Promise<SubmitTipResponse> {
    // Validate required fields
    if (!data.city_id || !data.title || !data.description) {
      throw new Error('Missing required fields: city_id, title, and description are required');
    }

    return this.request<SubmitTipResponse>('/submit-tip', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 9. Submit Pin
  async submitPin(data: SubmitPinRequest): Promise<SubmitPinResponse> {
    // Validate required fields
    if (!data.city_id || !data.title || !data.latitude || !data.longitude) {
      throw new Error('Missing required fields: city_id, title, latitude, and longitude are required');
    }

    return this.request<SubmitPinResponse>('/submit-pin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 10. Save City
  async saveCity(cityId: number): Promise<{ success: boolean }> {
    if (!cityId || cityId <= 0) {
      throw new Error('Invalid city ID');
    }
    return this.request<{ success: boolean }>('/save', {
      method: 'POST',
      body: JSON.stringify({ city_id: cityId }),
    });
  }

  // 11. Unsave City
  async unsaveCity(cityId: number): Promise<{ success: boolean }> {
    if (!cityId || cityId <= 0) {
      throw new Error('Invalid city ID');
    }
    return this.request<{ success: boolean }>('/save', {
      method: 'DELETE',
      body: JSON.stringify({ city_id: cityId }),
    });
  }

  // 12. Get Notifications
  async getNotifications(
    unreadOnly?: boolean,
    limit?: number
  ): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (unreadOnly !== undefined) {
      params.append('unreadOnly', unreadOnly.toString());
    }
    if (limit !== undefined) {
      params.append('limit', limit.toString());
    }
    const query = params.toString();
    return this.request<NotificationsResponse>(
      `/notifications${query ? `?${query}` : ''}`
    );
  }

  // 13. Mark Notification as Read
  async markNotificationRead(notificationId: number): Promise<{ success: boolean }> {
    if (!notificationId || notificationId <= 0) {
      throw new Error('Invalid notification ID');
    }
    return this.request<{ success: boolean }>(`/notifications/${notificationId}`, {
      method: 'PATCH',
    });
  }

  // 14. Mark All Notifications as Read
  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  // 15. Get Waitlist Count
  async getWaitlistCount(): Promise<WaitlistCountResponse> {
    return this.request<WaitlistCountResponse>('/waitlist-count', { useCache: true });
  }
}

export const apiClient = new ApiClient();