import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UsersService } from '@app/users/services';
import { RateService } from '@app/rate/rate.service';
import { CommentService } from '@app/comment/comment.service';
import { LikeCreatedEvent, LIKE_EVENT_KEYS } from '@app/like/events';
import { LikeAttitude } from '@app/like/schemas';

const LikeTargetNameList = ['Rate', 'Comment']

@Injectable()
export class UserLikeListener {
  constructor(
    private usersService: UsersService,
    private rateService: RateService,
    private commentService: CommentService,
  ) {}
  private readonly logger = new Logger(UserLikeListener.name);

  @OnEvent(LIKE_EVENT_KEYS.CREATED)
  async handleLikeEvent(event: LikeCreatedEvent) {
    if (LikeTargetNameList.findIndex(key => key === event.targetName) === -1) {
      this.logger.warn('点赞了未知的对象，无法继续:' + event)
      return;
    }

    if (event.attitude === LikeAttitude.like) {
      const targetUser = await (async () => {
        if (event.targetName === 'Rate') {
          const rate = await this.rateService.rateModel
            .findById(event.targetId)
          return rate.user;
        }

        if (event.targetName === 'Comment') {
          const comment = await this.commentService.commentModel
            .findById(event.targetId)
          
          return comment.user;
        }

        return undefined
      })()

      if (!targetUser) {
        return;
      }

      await this.usersService.userModel.updateOne(
        { _id: targetUser }, 
        { $inc: { likedCount: 1 } },
        { upsert: true }
      )
    }
  }

  @OnEvent(LIKE_EVENT_KEYS.CANCEL)
  async handleunLikeEvent(event: LikeCreatedEvent) {
    if (LikeTargetNameList.findIndex(key => key === event.targetName) === -1) {
      this.logger.warn('取消点赞了未知的对象，无法继续:' + event)
      return;
    }

    if (event.attitude === LikeAttitude.like) {
      const targetUser = await (async () => {
        if (event.targetName === 'Rate') {
          const rate = await this.rateService.rateModel
            .findById(event.targetId)
          return rate.user;
        }

        if (event.targetName === 'Comment') {
          const comment = await this.commentService.commentModel
            .findById(event.targetId)
          
          return comment.user;
        }

        return undefined
      })()

      if (!targetUser) {
        return;
      }

      await this.usersService.userModel.updateOne(
        { _id: targetUser }, 
        { $inc: { likedCount: -1 } },
        { upsert: true }
      )
    }
  }
  
}
