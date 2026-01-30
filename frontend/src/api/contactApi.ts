import apiClient from './client';
import type { ApiResponse, Contact, FriendRequest, SendFriendRequestPayload } from '../types';

export const getContacts = async (): Promise<Contact[]> => {
  const response = await apiClient.get<ApiResponse<Contact[]>>('/api/v1/contacts');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const deleteContact = async (uuid: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/contacts/${uuid}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const blockContact = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/contacts/${uuid}/block`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const unblockContact = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/contacts/${uuid}/unblock`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const sendFriendRequest = async (data: SendFriendRequestPayload): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>('/api/v1/requests', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const getPendingRequests = async (): Promise<FriendRequest[]> => {
  const response = await apiClient.get<ApiResponse<FriendRequest[]>>('/api/v1/requests/pending');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const getSentRequests = async (): Promise<FriendRequest[]> => {
  const response = await apiClient.get<ApiResponse<FriendRequest[]>>('/api/v1/requests/sent');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const acceptFriendRequest = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/requests/${uuid}/accept`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const rejectFriendRequest = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/requests/${uuid}/reject`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};
