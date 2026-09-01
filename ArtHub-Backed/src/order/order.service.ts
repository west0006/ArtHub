import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createTime: 'desc' },
    });
  }

  async findById(id: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({ data });
  }

  async update(id: number, userId: number, data: Prisma.OrderUpdateInput) {
    await this.findById(id, userId); // 校验所有权
    return this.prisma.order.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, userId: number) {
    await this.findById(id, userId);
    return this.prisma.order.delete({ where: { id } });
  }
}
