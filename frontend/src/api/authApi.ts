import apiClient from './client';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/api/v1/auth/me');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const logoutApi = async (): Promise<void> => {
  await apiClient.post('/api/v1/auth/logout');
};
