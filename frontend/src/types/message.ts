export interface Message {
  uuid: string;
  sessionId: string;
  type: MessageType;
  content: string;
  url?: string;
  sendId: string;
  sendName: string;
  sendAvatar: string;
  receiveId: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  status: number;
  createdAt: string;
}

export enum MessageType {
  Text = 0,
  Voice = 1,
  File = 2,
  Image = 3,
  VideoCall = 4,
}

export interface Session {
  uuid: string;
  receiveId: string;
  receiveName: string;
  avatar: string;
  lastMessage: string;
  lastMessageAt?: string;
  unreadCount: number;
  updatedAt: string;
}

export interface CreateSessionRequest {
  receiveId: string;
  receiveName: string;
  avatar?: string;
}

export interface SendMessageRequest {
  sessionId: string;
  receiveId: string;
  type: MessageType;
  content?: string;
  url?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
}
