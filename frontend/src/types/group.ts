export interface Group {
  uuid: string;
  name: string;
  notice: string;
  avatar: string;
  ownerId: string;
  addMode: number;
  memberCnt: number;
  members: string[];
  createdAt: string;
}

export interface GroupMember {
  uuid: string;
  nickname: string;
  avatar: string;
  isOwner: boolean;
}

export interface CreateGroupRequest {
  name: string;
  notice?: string;
  addMode?: number;
}

export interface UpdateGroupRequest {
  name?: string;
  notice?: string;
  avatar?: string;
  addMode?: number;
}
