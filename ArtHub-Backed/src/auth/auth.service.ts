import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { WechatService } from './wechat.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isDev: boolean;
  private readonly devTestCode: string;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private wechatService: WechatService,
    private config: ConfigService,
  ) {
    this.isDev = this.config.get<string>('NODE_ENV') === 'development';
    this.devTestCode = this.config.get<string>('DEV_TEST_CODE', '');
  }

  /**
   * 微信登录（开发环境支持 test code 绕过）
   */
  async loginByWechat(
    code: string,
    userInfo?: { nickName: string; avatarUrl: string },
  ) {
    // 开发环境 + 测试码：直接创建/返回测试用户，不调用微信 API
    if (this.isDev && this.devTestCode && code === this.devTestCode) {
      this.logger.warn('Dev test code used, bypassing WeChat API');
      const user = await this.userService.findOrCreateByOpenid(
        'dev_test_openid_' + Date.now(),
        '测试画师',
        '/images/1.jpg',
      );
      return this.generateTokens(user);
    }

    // 正式流程：通过 code 换取 openid
    const { openid, unionid } = await this.wechatService.getOpenid(code);
    const user = await this.userService.findOrCreateByOpenid(
      openid,
      userInfo?.nickName,
      userInfo?.avatarUrl,
    );
    if (unionid && !user.unionid) {
      await this.userService.updateUser(user.id, { unionid });
    }
    return this.generateTokens(user);
  }

  /**
   * 邮箱登录
   */
  async loginByEmail(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('邮箱未注册');

    const valid = await this.userService.validatePassword(user.id, password);
    if (!valid) throw new UnauthorizedException('密码错误');

    return this.generateTokens(user);
  }

  /**
   * 邮箱注册
   */
  async registerByEmail(email: string, password: string, nickname?: string) {
    const existing = await this.userService.findByEmail(email);
    if (existing) throw new UnauthorizedException('邮箱已注册');

    const user = await this.userService.createByEmail(
      email,
      password,
      nickname,
    );
    return this.generateTokens(user);
  }

  /**
   * 刷新令牌
   */
  async refreshToken(refreshToken: string) {
    const user = await this.userService.findByRefreshToken(refreshToken);
    if (!user) throw new UnauthorizedException('Invalid refresh token');

    const newAccessToken = this.jwtService.sign(
      { sub: user.id, openid: user.openid, role: user.role },
      { expiresIn: '7d' },
    );
    const newRefreshToken = uuidv4();
    await this.userService.setRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }

  /**
   * 登出
   */
  async logout(userId: number) {
    await this.userService.setRefreshToken(userId, null);
  }

  // ---------- 私有方法 ----------
  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      openid: user.openid,
      role: user.role,
      email: user.email || '', // 新增，若无则为空字符串
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = uuidv4();
    await this.userService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
        email: user.email,
      },
    };
  }
}
