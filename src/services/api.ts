const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export const api = {
  async request(endpoint: string, options: RequestOptions = {}) {
    const token = localStorage.getItem('token');
    
    // Configure default headers
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Build URL with search query parameters if passed
    let url = `${BASE_URL}${endpoint}`;
    if (options.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    const response = await fetch(url, config);

    // Dynamic response interceptor logic
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message ||
        errorData.detail?.message ||
        (typeof errorData.detail === 'string' ? errorData.detail : null) ||
        `Request failed with status ${response.status}`;
      
      // Auto-logout if session expires (401 Unauthorized)
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  },

  get(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },

  put(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },

  delete(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};
export default api;
