import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderService } from './order.service';
import { Prisma } from '@prisma/client';
import type { AuthenticatedRequest } from '../types/express';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.orderService.findByUser(req.user.userId);
  }

  @Get(':id')
  async getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orderService.findById(+id, req.user.userId);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: Prisma.OrderCreateInput,
  ) {
    return this.orderService.create({
      ...body,
      user: { connect: { id: req.user.userId } },
    });
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: Prisma.OrderUpdateInput,
  ) {
    return this.orderService.update(+id, req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.orderService.delete(+id, req.user.userId);
  }
}
