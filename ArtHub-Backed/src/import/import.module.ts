import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { OrderModule } from '../order/order.module';
import { OcrService } from './ocr.service';
import { GenericTextParser } from './parsers/generic-text.parser';
import { MihuaShiParser } from './parsers/mihuashi.parser';
import { HuaJiaParser } from './parsers/huajia.parser';
import { LinJieParser } from './parsers/linjie.parser';

@Module({
  imports: [OrderModule],
  controllers: [ImportController],
  providers: [
    ImportService,
    OcrService,
    GenericTextParser,
    MihuaShiParser,
    HuaJiaParser,
    LinJieParser,
  ],
})
export class ImportModule {}
