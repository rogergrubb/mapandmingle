const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private token: string | null = null;
  private userId: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      body?: any;
      params?: Record<string, any>;
    }
  ): Promise<T> {
    let url = `${API_BASE_URL}${endpoint}`;
    
    // Add query params
    if (options?.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>('POST', endpoint, { body });
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>('PUT', endpoint, { body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }
}

export const api = new ApiClient();
