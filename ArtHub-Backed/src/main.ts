import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { LoggingInterceptor } from './common/logging.interceptor';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 全局异常过滤
  app.useGlobalFilters(new AllExceptionsFilter());

  // 请求日志
  app.useGlobalInterceptors(new LoggingInterceptor());

  // 跨域
  app.enableCors({
    origin: [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      // 后续添加小程序 WebView 域名、正式域名等
    ],
    credentials: true,
  });

  // 允许访问项目根目录下的 images 文件夹
  app.useStaticAssets(join(__dirname, '..', 'images'), {
    prefix: '/images/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
