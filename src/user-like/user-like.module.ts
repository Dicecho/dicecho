import { Module } from '@nestjs/common';
import { RateModule } from '@app/rate/rate.module';
import { CommentModule } from '@app/comment/comment.module';
import { LikeModule } from '@app/like/like.module';
import { UsersModule } from '@app/users/users.module';
import { UserLikeListener } from '@app/user-like/listeners'

@Module({
  imports: [
    CommentModule,
    LikeModule,
    UsersModule,
    RateModule,
  ],
  providers: [
    UserLikeListener
  ],
})
export class UserLikeModule {}
