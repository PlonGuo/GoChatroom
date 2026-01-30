export interface User {
  uuid: string;
  nickname: string;
  email: string;
  avatar: string;
  gender: number;
  signature: string;
  birthday: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  nickname?: string;
  avatar?: string;
  gender?: number;
  signature?: string;
  birthday?: string;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
