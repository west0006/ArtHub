import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const adapter = new PrismaMariaDb({
      host: configService.get('DB_HOST', 'localhost'),
      port: parseInt(configService.get('DB_PORT', '3306'), 10),
      user: configService.get('DB_USER', 'root'),
      password: configService.get('DB_PASSWORD', ''),
      database: configService.get('DB_NAME', 'wechat_auth'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
