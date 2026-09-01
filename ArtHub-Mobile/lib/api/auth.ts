// lib/api/auth.ts
import request from '../request';
import type { LoginResponse, UserProfile } from '@/types/api';

/** 邮箱登录 */
export const emailLogin = (email: string, password: string): Promise<LoginResponse> =>
    request.post<LoginResponse>('/auth/email/login', { email, password }).then(res => res.data);

/** 邮箱注册 */
export const emailRegister = (email: string, password: string, nickname?: string): Promise<LoginResponse> =>
    request.post<LoginResponse>('/auth/email/register', { email, password, nickname }).then(res => res.data);

/** 获取用户资料 */
export const getUserProfile = (): Promise<UserProfile> =>
    request.get<UserProfile>('/auth/profile').then(res => res.data);

/** 更新用户资料 */
export const updateUserProfile = (data: Partial<UserProfile>): Promise<UserProfile> =>
    request.put<UserProfile>('/auth/profile', data).then(res => res.data);

/** 修改密码 */
export const changePassword = (oldPassword: string, newPassword: string): Promise<void> =>
    request.put('/auth/password', { oldPassword, newPassword }).then(res => res.data);