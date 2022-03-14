import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notice as NoticeDocument, NoticeSchema } from './schemas';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: NoticeDocument.name, schema: NoticeSchema },
    ]),
  ],
  providers: [NoticeService],
  controllers: [NoticeController],
  exports: [
    NoticeService,
  ],
})
export class NoticeModule {}
