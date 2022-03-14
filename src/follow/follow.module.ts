import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow as FollowDocument, FollowSchema } from './schemas';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: FollowDocument.name, schema: FollowSchema },
    ]),
  ],
  providers: [FollowService],
  controllers: [FollowController],
  exports: [
    FollowService,
  ],
})
export class FollowModule {}
