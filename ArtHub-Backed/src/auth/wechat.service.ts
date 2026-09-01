import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface WechatSessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatService {
  constructor(private config: ConfigService) {}

  async getOpenid(code: string): Promise<{ openid: string; unionid?: string }> {
    // 使用 as string 断言
    const appid = this.config.get('WECHAT_APPID') as string;
    const secret = this.config.get('WECHAT_SECRET') as string;

    if (!appid || !secret) {
      throw new Error('微信 AppId 或 Secret 未配置');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    // 使用 as 断言响应类型
    const res = await axios.get(url);
    const data = res.data as WechatSessionResponse;

    if (data.errcode) {
      throw new Error(`微信登录失败: ${data.errmsg || '未知错误'}`);
    }

    return {
      openid: data.openid,
      unionid: data.unionid,
    };
  }
}
