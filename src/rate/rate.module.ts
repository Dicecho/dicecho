import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Rate as RateDocument, RateSchema } from './schemas';
import { Mod as ModDocument, ModSchema } from '@app/mod/schemas';
import { ReportModule } from '@app/report/report.module';
import { LikeModule } from '@app/like/like.module';
import { ModModule } from '@app/mod/mod.module';
import { RateService } from './rate.service';
import { RateController } from './rate.controller';
import { RateWeightUpdatedListener } from './listeners';
import { BlockModule } from '@app/block/block.module';
import { OperationLogModule } from '@app/operationLog/log.module';
import { RichtextModule } from '@app/richtext/richtext.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: RateDocument.name, schema: RateSchema },
      { name: ModDocument.name, schema: ModSchema },
    ]),
    ModModule,
    LikeModule,
    ReportModule,
    BlockModule,
    OperationLogModule,
    RichtextModule,
  ],
  providers: [
    RateService,
    RateWeightUpdatedListener,
  ],
  controllers: [RateController],
  exports: [
    RateService,
  ],
})
export class RateModule {}
