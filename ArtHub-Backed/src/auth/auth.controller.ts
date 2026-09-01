import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import type { AuthenticatedRequest } from '../types/express';
import { Throttle } from '@nestjs/throttler';

class WechatLoginDto {
  code: string;
  nickName?: string;
  avatarUrl?: string;
}

class RefreshTokenDto {
  refreshToken: string;
}

class UpdateProfileDto {
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 每分钟最多 10 次
  @Post('wechat/login')
  async wechatLogin(@Body() dto: WechatLoginDto) {
    const userInfo =
      dto.nickName || dto.avatarUrl
        ? { nickName: dto.nickName || '', avatarUrl: dto.avatarUrl || '' }
        : undefined;
    return this.authService.loginByWechat(dto.code, userInfo);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 每小时重试限制
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 每小时重试限制
  @Post('email/register')
  async emailRegister(
    @Body() dto: { email: string; password: string; nickname?: string },
  ) {
    return this.authService.registerByEmail(
      dto.email,
      dto.password,
      dto.nickname,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 每小时重试限制
  @Post('email/login')
  async emailLogin(@Body() dto: { email: string; password: string }) {
    return this.authService.loginByEmail(dto.email, dto.password);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: AuthenticatedRequest) {
    await this.authService.logout(req.user.userId);
    return { message: 'Logged out' };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.getUserWithDecryptedPhone(
      req.user.userId,
    );
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      role: user.role,
    };
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user.userId;

    // 构造符合 UserService.updateUser 参数类型的对象
    const updateData: Partial<{
      nickname: string;
      avatarUrl: string;
      phone: string;
    }> = {};

    if (dto.nickname !== undefined) {
      updateData.nickname = dto.nickname;
    }
    if (dto.avatarUrl !== undefined) {
      updateData.avatarUrl = dto.avatarUrl;
    }
    if (dto.phone !== undefined) {
      updateData.phone = dto.phone;
    }

    await this.userService.updateUser(userId, updateData);

    // 获取解密手机号后的最新用户信息
    const decryptedUser =
      await this.userService.getUserWithDecryptedPhone(userId);
    if (!decryptedUser) {
      throw new NotFoundException('User not found after update');
    }

    return {
      id: decryptedUser.id,
      nickname: decryptedUser.nickname,
      avatarUrl: decryptedUser.avatarUrl,
      phone: decryptedUser.phone,
      role: decryptedUser.role,
    };
  }
}
