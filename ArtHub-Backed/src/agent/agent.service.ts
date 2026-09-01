import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AgentFeedback, Prisma } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  /**
   * 记录 Agent 反馈
   */
  recordFeedback(
    userId: number,
    context: string,
    suggestion: string,
    action: 'accepted' | 'modified' | 'rejected',
  ): Prisma.Prisma__AgentFeedbackClient<AgentFeedback> {
    return this.prisma.agentFeedback.create({
      data: {
        userId,
        context,
        suggestion,
        action,
      },
    });
  }

  /**
   * 获取反馈统计（默认近 30 天）
   */
  async getFeedbackStats(
    userId: number,
    context?: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<{
    total: number;
    accepted: number;
    rejected: number;
    acceptanceRate: string;
    period: { start: Date; end: Date };
  }> {
    const endDate = options?.endDate ?? new Date();
    const startDate =
      options?.startDate ??
      new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const where: Prisma.AgentFeedbackWhereInput = {
      userId,
      createTime: { gte: startDate, lte: endDate },
    };
    if (context) where.context = context;

    const total = await this.prisma.agentFeedback.count({ where });
    const accepted = await this.prisma.agentFeedback.count({
      where: { ...where, action: 'accepted' },
    });
    const rejected = await this.prisma.agentFeedback.count({
      where: { ...where, action: 'rejected' },
    });

    return {
      total,
      accepted,
      rejected,
      acceptanceRate: total > 0 ? (accepted / total).toFixed(2) : '0.00',
      period: { start: startDate, end: endDate },
    };
  }

  /**
   * 获取最近反馈列表
   */
  getRecentFeedback(
    userId: number,
    limit = 20,
  ): Prisma.PrismaPromise<AgentFeedback[]> {
    return this.prisma.agentFeedback.findMany({
      where: { userId },
      orderBy: { createTime: 'desc' },
      take: limit,
    });
  }
}
