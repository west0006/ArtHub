import request from '../utils/request';

interface WechatLoginParams {
  code: string;
  nickName?: string;
  avatarUrl?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    nickname: string;
    avatarUrl: string;
    role: number;
  };
}

// 微信登录
export const loginByWechat = (params: WechatLoginParams): Promise<LoginResponse> => {
  return request({ url: '/auth/wechat/login', method: 'POST', data: params });
};

// 刷新 token
export const refreshToken = (refreshToken: string): Promise<LoginResponse> => {
  return request({ url: '/auth/refresh', method: 'POST', data: { refreshToken } });
};

// 获取用户资料
export const getUserProfile = (): Promise<LoginResponse['user']> => {
  return request({ url: '/auth/profile', method: 'GET' });
};