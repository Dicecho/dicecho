import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag as TagDocument, TagSchema } from './schemas';
import { OperationLogModule } from '@app/operationLog/log.module';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: TagDocument.name, schema: TagSchema },
    ]),
    OperationLogModule,
  ],
  providers: [TagService],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule {}

