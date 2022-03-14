import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment as CommentDocument, CommentSchema } from './schemas';
import { LikeModule } from '@app/like/like.module';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { BlockModule } from '@app/block/block.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: CommentDocument.name, schema: CommentSchema },
    ]),
    LikeModule,
    BlockModule,
  ],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [
    CommentService,
  ],
})
export class CommentModule {}
