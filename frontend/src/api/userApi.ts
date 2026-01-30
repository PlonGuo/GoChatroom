import apiClient from './client';
import type { ApiResponse, User, UpdateProfileRequest, UpdatePasswordRequest } from '../types';

export const getUser = async (uuid: string): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>(`/api/v1/users/${uuid}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/api/v1/users/search', {
    params: { q: query },
  });
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>('/api/v1/users/profile', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const updatePassword = async (data: UpdatePasswordRequest): Promise<void> => {
  const response = await apiClient.put<ApiResponse<void>>('/api/v1/users/password', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  return updatePassword({ old_password: currentPassword, new_password: newPassword });
};
