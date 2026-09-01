import axios from 'axios';
import request from '@/lib/request';       // 用于需要登录态的请求
// 未登录时使用的 axios 实例（无 token 拦截）
const publicRequest = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    nickname: string;
    avatarUrl?: string;
    role: number;
    email?: string;
  };
}

export interface UserProfile {
  id: number;
  nickname: string;
  avatarUrl?: string;
  phone?: string;
  role: number;
  email?: string;
  createTime?: string;
}

/**
 * 邮箱登录
 */
export const emailLogin = (email: string, password: string) =>
  publicRequest.post<LoginResponse>('/auth/email/login', { email, password });

/**
 * 邮箱注册
 */
export const emailRegister = (email: string, password: string, nickname?: string) =>
  publicRequest.post<LoginResponse>('/auth/email/register', { email, password, nickname });

/**
 * 获取当前用户资料（需认证）
 */
export const getUserProfile = () =>
  request.get<UserProfile>('/auth/profile').then((res) => res.data);

/**
 * 更新用户资料
 */
export const updateUserProfile = (data: {
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
}) => request.put<UserProfile>('/auth/profile', data);

/**
 * 修改密码
 */
export const changePassword = (oldPassword: string, newPassword: string) =>
  request.put('/auth/password', { oldPassword, newPassword });