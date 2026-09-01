import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { encrypt, decrypt } from '../common/crypto.util';

@Injectable()
export class UserService {
  private readonly encryptionKey: Buffer;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const key = this.config.get<string>('PHONE_ENCRYPTION_KEY');
    if (!key || Buffer.from(key, 'hex').length !== 32) {
      throw new Error('PHONE_ENCRYPTION_KEY must be a 32-byte hex string');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  async findByRefreshToken(token: string) {
    return this.prisma.user.findFirst({ where: { refreshToken: token } });
  }

  /**
   * 根据 openid 查找或创建用户，若已存在且传入新昵称/头像则自动更新
   */
  async findOrCreateByOpenid(
    openid: string,
    nickname?: string,
    avatarUrl?: string,
  ) {
    let user = await this.prisma.user.findUnique({ where: { openid } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openid,
          nickname: nickname || '微信用户',
          avatarUrl: avatarUrl || '',
        },
      });
    } else {
      // 更新最新微信资料（仅当有变化时）
      const updatePayload: Record<string, string> = {};
      if (nickname && user.nickname !== nickname) {
        updatePayload.nickname = nickname;
      }
      if (avatarUrl && user.avatarUrl !== avatarUrl) {
        updatePayload.avatarUrl = avatarUrl;
      }
      if (Object.keys(updatePayload).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updatePayload,
        });
      }
    }

    return user;
  }

  /**
   * 更新用户信息，若包含手机号则自动加密
   */
  async updateUser(
    id: number,
    data: Partial<{
      nickname: string;
      avatarUrl: string;
      phone: string;
      unionid: string;
      role: number;
    }>,
  ) {
    if (data.phone) {
      data.phone = encrypt(data.phone, this.encryptionKey);
    }
    return this.prisma.user.update({ where: { id }, data });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * 获取用户并解密手机号（用于返回给前端）
   */
  async getUserWithDecryptedPhone(id: number) {
    const user = await this.findById(id);
    if (user && user.phone) {
      try {
        user.phone = decrypt(user.phone, this.encryptionKey);
      } catch (err) {
        // 解密失败时记录日志，但仍返回加密内容（或置空）
        console.error(`Failed to decrypt phone for user ${id}`, err);
      }
    }
    return user;
  }

  async findByOpenid(openid: string) {
    return this.prisma.user.findUnique({ where: { openid } });
  }

  async setRefreshToken(userId: number, token: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }

  // 邮箱相关功能
  async createByEmail(email: string, password: string, nickname?: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const fakeOpenid =
      'email_' + Buffer.from(email).toString('hex') + '_' + Date.now();
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname: nickname || '新用户',
        role: 0,
        openid: fakeOpenid,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async validatePassword(userId: number, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async updatePassword(userId: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
