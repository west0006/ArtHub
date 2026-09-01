import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MaterialModule } from './material/material.module';
import { AgentModule } from './agent/agent.module';
import { ImportModule } from './import/import.module';
import { OssModule } from './oss/oss.module';
import { AiModule } from './ai/ai.module';
import { AppThrottlerModule } from './throttler/throttler.module';
import { StockController } from './stock/stock.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AppThrottlerModule, // 限流（必须在全局守卫提供之前）

    PrismaModule,
    AuthModule,
    OrderModule,
    DashboardModule,
    MaterialModule,
    AgentModule,
    ImportModule,
    OssModule,

    HttpModule,
    AiModule,
  ],
  controllers: [StockController],
  providers: [],
})
export class AppModule {}
