// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Travel related types (example for your trust-travel project)
export interface TravelDestination {
  id: string;
  name: string;
  country: string;
  description: string;
  imageUrl?: string;
  rating: number;
  trustScore: number;
  createdAt: string;
}
