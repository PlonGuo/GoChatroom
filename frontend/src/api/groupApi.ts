import apiClient from './client';
import type { ApiResponse, Group, GroupMember, CreateGroupRequest, UpdateGroupRequest } from '../types';

export const createGroup = async (data: CreateGroupRequest): Promise<Group> => {
  const response = await apiClient.post<ApiResponse<Group>>('/api/v1/groups', data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const getGroup = async (uuid: string): Promise<Group> => {
  const response = await apiClient.get<ApiResponse<Group>>(`/api/v1/groups/${uuid}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const getMyGroups = async (): Promise<Group[]> => {
  const response = await apiClient.get<ApiResponse<Group[]>>('/api/v1/groups/my');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const searchGroups = async (query: string): Promise<Group[]> => {
  const response = await apiClient.get<ApiResponse<Group[]>>('/api/v1/groups/search', {
    params: { q: query },
  });
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const updateGroup = async (uuid: string, data: UpdateGroupRequest): Promise<Group> => {
  const response = await apiClient.put<ApiResponse<Group>>(`/api/v1/groups/${uuid}`, data);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!;
};

export const dissolveGroup = async (uuid: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/groups/${uuid}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const getGroupMembers = async (uuid: string): Promise<GroupMember[]> => {
  const response = await apiClient.get<ApiResponse<GroupMember[]>>(`/api/v1/groups/${uuid}/members`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data || [];
};

export const joinGroup = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/groups/${uuid}/join`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const leaveGroup = async (uuid: string): Promise<void> => {
  const response = await apiClient.post<ApiResponse<void>>(`/api/v1/groups/${uuid}/leave`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};

export const kickMember = async (groupUuid: string, memberUuid: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse<void>>(`/api/v1/groups/${groupUuid}/members/${memberUuid}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
};
