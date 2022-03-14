import { OperationLogService } from '@app/operationLog/services';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationLogController } from './log.controller';
import {
  AdminLog as AdminLogDocument,
  AdminLogSchema,
  OperationLog as OperationLogDocument,
  OperationLogSchema,
} from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OperationLogDocument.name, schema: OperationLogSchema },
      { name: AdminLogDocument.name, schema: AdminLogSchema },
    ]),
  ],
  controllers: [OperationLogController],
  providers: [OperationLogService],
  exports: [OperationLogService],
})
export class OperationLogModule {}
