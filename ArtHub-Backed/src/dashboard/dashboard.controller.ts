import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest } from '../types/express';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(
    private orderService: OrderService,
    private prisma: PrismaService,
  ) {}

  @Get('summary')
  async getSummary(@Req() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    const orders = await this.orderService.findByUser(userId);
    const completed = orders.filter((o) => o.status === 'completed');
    const pending = orders.filter(
      (o) => o.status === 'pending' || o.status === 'progress',
    );

    const materialCount = await this.prisma.material.count({
      where: { userId },
    });

    return {
      orderCount: orders.length,
      totalIncome: completed.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      completedOrders: completed.length,
      pendingOrders: pending.length,
      materialCount,
      tutorialCount: 0, // 后续扩展
    };
  }
}
