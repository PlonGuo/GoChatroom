import apiClient from './client';
import type { ApiResponse, Session, CreateSessionRequest, Message, SendMessageRequest } from '../types';

export const getSessions = async (): Promise<Session[]> => {
  const response = await apiClient.get<ApiResponse<Session[]>>('/api/v1/sessions');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const getSession = async (uuid: string): Promise<Session> => {
  const response = await apiClient.get<ApiResponse<Session>>(`/api/v1/sessions/${uuid}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const createSession = async (data: CreateSessionRequest): Promise<Session> => {
  const response = await apiClient.post<ApiResponse<Session>>('/api/v1/sessions', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const deleteSession = async (uuid: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/sessions/${uuid}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const clearSessionUnread = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/sessions/${uuid}/read`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const getMessages = async (sessionId: string, limit = 50, offset = 0): Promise<Message[]> => {
  const response = await apiClient.get<ApiResponse<Message[]>>('/api/v1/messages', {
    params: { sessionId, limit, offset },
  });
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const sendMessage = async (data: SendMessageRequest): Promise<Message> => {
  const response = await apiClient.post<ApiResponse<Message>>('/api/v1/messages', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const markMessageAsRead = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/messages/${uuid}/read`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const markAllAsRead = async (sessionId: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/messages/sessions/${sessionId}/read-all`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<ApiResponse<{ count: number }>>('/api/v1/messages/unread-count');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data?.count || 0;
};
