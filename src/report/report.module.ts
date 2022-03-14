import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { 
  Report as ReportDocument, ReportSchema,
  Appeal as AppealDocument, AppealSchema,
} from './schemas';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: ReportDocument.name, schema: ReportSchema },
      { name: AppealDocument.name, schema: AppealSchema },
    ]),
  ],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [
    ReportService,
  ],
})
export class ReportModule {}
