import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
