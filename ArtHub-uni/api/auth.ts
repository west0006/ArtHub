import request from '@/utils/request';

interface WechatLoginParams {
  code : string;
  nickName ?: string;
  avatarUrl ?: string;
}

interface LoginResponse {
  accessToken : string;
  refreshToken : string;
  expiresIn : number;
  user : {
    id : number;
    nickname : string;
    avatarUrl : string;
    role : number;
  };
}

export const loginByWechat = (params : WechatLoginParams) : Promise<LoginResponse> => {
  return request({ url: '/auth/wechat/login', method: 'POST', data: params });
};

export const refreshToken = (refreshToken : string) : Promise<LoginResponse> => {
  return request({ url: '/auth/refresh', method: 'POST', data: { refreshToken } });
};

export const getUserProfile = () : Promise<LoginResponse['user']> => {
  return request({ url: '/auth/profile', method: 'GET' });
};