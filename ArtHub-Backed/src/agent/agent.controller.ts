import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgentService } from './agent.service';
import type { AuthenticatedRequest } from '../types/express';

class FeedbackDto {
  context: string;
  suggestion: string;
  action: 'accepted' | 'modified' | 'rejected';
}

@Controller('agent')
@UseGuards(AuthGuard('jwt'))
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Post('feedback')
  async submitFeedback(
    @Req() req: AuthenticatedRequest,
    @Body() dto: FeedbackDto,
  ) {
    return this.agentService.recordFeedback(
      req.user.userId,
      dto.context,
      dto.suggestion,
      dto.action,
    );
  }

  @Get('feedback-stats')
  async getStats(
    @Req() req: AuthenticatedRequest,
    @Query('context') context?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.agentService.getFeedbackStats(req.user.userId, context, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('feedback-recent')
  async getRecent(@Req() req: AuthenticatedRequest) {
    return this.agentService.getRecentFeedback(req.user.userId);
  }
}
