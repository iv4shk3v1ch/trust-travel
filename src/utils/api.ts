// API utility functions

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Generic API fetch wrapper
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = `${API_BASE_URL}/api${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });
  
  if (!response.ok) {
    throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
  }
  
  return response.json();
}

// Specific API functions
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch('/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password, action: 'login' }),
    }),
  
  register: (email: string, password: string, name: string) =>
    apiFetch('/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, action: 'register' }),
    }),
  
  // Users
  getUsers: () => apiFetch('/users'),
  
  createUser: (userData: any) =>
    apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  // Add more API endpoints as needed
};
