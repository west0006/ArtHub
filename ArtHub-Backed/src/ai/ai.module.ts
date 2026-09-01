import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // 与 Python Agent 的超时保持一致
      maxRedirects: 5,
    }),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
