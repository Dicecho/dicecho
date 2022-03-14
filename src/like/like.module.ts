import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Like as LikeDocument, LikeSchema } from './schemas';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: LikeDocument.name, schema: LikeSchema },
    ]),
  ],
  providers: [LikeService],
  controllers: [LikeController],
  exports: [
    LikeService,
  ],
})
export class LikeModule {}
