import apiClient from './client';
import type { ApiResponse } from '../types';

export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

interface ICEServersResponse {
  iceServers: ICEServer[];
}

export const getICEServers = async (): Promise<ICEServer[]> => {
  const response = await apiClient.get<ApiResponse<ICEServersResponse>>('/api/v1/webrtc/ice-servers');
  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }
  return response.data.data!.iceServers;
};
