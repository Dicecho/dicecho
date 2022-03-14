import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification as NotificationDocument, NotificationSchema } from './schemas';
import { PushNotifacationListener, NotificationListener } from './listeners';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { ForumModule } from '@app/forum/forum.module';
import { CollectionModule } from '@app/collection/collection.module';
import { LikeModule } from '@app/like/like.module';
import { RateModule } from '@app/rate/rate.module';
import { CommentModule } from '@app/comment/comment.module';
import { BlockModule } from '@app/block/block.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: NotificationDocument.name, schema: NotificationSchema },
    ]),
    LikeModule,
    CommentModule,
    RateModule,
    ForumModule,
    BlockModule,
    CollectionModule,
  ],
  providers: [
    NotificationService,
    PushNotifacationListener,
    NotificationListener,
  ],
  controllers: [NotificationController],
})
export class NotificationModule {}
