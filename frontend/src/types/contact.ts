export interface Contact {
  uuid: string;
  nickname: string;
  avatar: string;
  signature: string;
  status: number;
}

export interface FriendRequest {
  uuid: string;
  userId: string;
  userName: string;
  userAvatar: string;
  contactId: string;
  contactType: number;
  status: number;
  message: string;
  createdAt: string;
}

// Alias for backwards compatibility
export type ContactApply = FriendRequest;

export interface SendFriendRequestPayload {
  contactId: string;
  message?: string;
}
