const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Custom fetch wrapper that automatically includes credentials (cookies)
 * and intercepts 401 Unauthorized errors to attempt a token refresh.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Extremely important for sending HTTP-only cookies
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized, attempt to refresh token
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        // Token refreshed successfully, save it and retry original request
        const refreshData = await refreshRes.json();
        localStorage.setItem('accessToken', refreshData.accessToken);
        
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${refreshData.accessToken}`
        };
        
        response = await fetch(url, config);
      } else {
        // Refresh failed, force logout via Zustand store
        window.dispatchEvent(new Event('auth:unauthorized'));
        throw new Error('Session expired. Please log in again.');
      }
    } catch (refreshErr) {
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw refreshErr;
    }
  }

  // Parse JSON response
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data?.error || response.statusText || 'An API error occurred');
  }

  return data;
}
