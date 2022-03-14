import { Module, HttpModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Mod as ModDocument,
  ModSchema,
} from './schemas';
import {
  Rate as RateDocument,
  RateSchema,
} from '@app/rate/schemas/rate.schema';
import {
  Config as ConfigDocument,
  ConfigSchema,
} from '@app/shared/config.schema';
import { TagModule } from '@app/tag/tag.module';
import { LikeModule } from '@app/like/like.module';
import { BlockModule } from '@app/block/block.module';
import { ReportModule } from '@app/report/report.module';
import { OperationLogModule } from '@app/operationLog/log.module';
import { ModController } from './mod.controller';
import { FileModule } from '@app/file/file.module';
import { ModService } from '@app/mod/services';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15 * 1000,
      maxRedirects: 5,
    }),
    MongooseModule.forFeature([
      { name: RateDocument.name, schema: RateSchema },
      { name: ConfigDocument.name, schema: ConfigSchema },
      { name: ModDocument.name, schema: ModSchema },
    ]),
    FileModule,
    LikeModule,
    ReportModule,
    TagModule,
    OperationLogModule,
    BlockModule,
  ],
  controllers: [ModController],
  providers: [ModService],
  exports: [ModService],
})
export class ModModule {}
