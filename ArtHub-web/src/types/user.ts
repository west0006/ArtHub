export interface UserProfile {
  id: number;
  nickname: string;
  avatarUrl?: string;
  phone?: string;
  role: number;
  email?: string;
  createTime?: string;
}