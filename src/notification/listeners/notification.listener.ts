import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose'
import { ObjectId } from 'mongodb';
import { OnEvent } from '@nestjs/event-emitter';
import { RateService } from '@app/rate/rate.service';
import { INotificationCreatedEvent } from '@app/notification/events';
import { CommentService } from '@app/comment/comment.service';
import { CollectionService } from '@app/collection/collection.service';
import { NotificationService } from '@app/notification/notification.service';
import { ForumService } from '@app/forum/forum.service';
import { NotificationType } from '@app/notification/constants';
import { Like, LikeAttitude } from '@app/like/schemas';
import { getObjectId } from '@app/utils';
import { LikeCreatedEvent, LikeCancelEvent, LIKE_EVENT_KEYS } from '@app/like/events';
import { CommentEvent, ReplyEvent, COMMENT_EVENT_KEYS } from '@app/comment/events';
import { FollowEvent, FOLLOW_EVENT_KEYS } from '@app/users/events';
import { ReportCreatedEvent } from '@app/report/events';

const LikeTargetNameList = ['Rate', 'Comment']
const CommentTargetNameList = ['Rate', 'Topic', 'Collection']

@Injectable()
export class NotificationListener {
  constructor(
    // @InjectModel(RateDocument.name) public rateModel: Model<RateDocument>,
    private notificationService: NotificationService,
    private rateService: RateService,
    private commentService: CommentService,
    private forumService: ForumService,
    private collectionService: CollectionService,
  ) {}
  private readonly logger = new Logger(NotificationListener.name);

  @OnEvent(LIKE_EVENT_KEYS.CREATED)
  async handleLikeEvent(event: LikeCreatedEvent) {
    if (LikeTargetNameList.findIndex(key => key === event.targetName) === -1) {
      this.logger.warn('点赞了未知的对象，无法生成提醒:' + event)
      return;
    }

    if (event.attitude === LikeAttitude.dislike) {
      return;
    }

    const checkNotification = await this.notificationService.notificationModel.findOne({
      sender: new ObjectId(event.userId),
      type: NotificationType.Like,
      'data.targetName': event.targetName,
      'data.targetId': event.targetId,
      'data.attitude': event.attitude,
    })

    if (checkNotification) {
      return;
    }

    if (event.targetName === 'Rate') {
      const rate = await this.rateService.rateModel
        .findById(event.targetId)
        .populate('mod')
      if (!rate) {
        this.logger.warn('点赞了未知的评价，无法生成提醒:' + event)
        return;
      }

      if (rate.mod instanceof ObjectId) {
        this.logger.warn('评价mod产生未知错误:' + event)
        return;
      }

      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient: rate.user instanceof ObjectId ? rate.user.toHexString() : rate.user._id.toHexString(),
        type: NotificationType.Like,
        data: {
          targetName: event.targetName,
          targetId: event.targetId,
          content: rate.remark,
          attitude: event.attitude,
          mod: {
            _id: rate.mod._id.toHexString(),
            title: rate.mod.title,
          }
        },
      })
      return;
    }

    if (event.targetName === 'Comment') {
      const comment = await this.commentService.commentModel
        .findById(event.targetId)
      if (!comment) {
        this.logger.warn('点赞了未知的评论，无法生成提醒:' + event)
        return;
      }

      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient: comment.user instanceof ObjectId ? comment.user.toHexString() : comment.user._id.toHexString(),
        type: NotificationType.Like,
        data: {
          targetName: event.targetName,
          targetId: event.targetId,
          content: comment.content,
          attitude: event.attitude,
        },
      })
      return;
    }

    // if 
    // await this.notificationService.createNotification({
    //   senderId: event.userId,
    // })
    // console.log(event)
  }

  @OnEvent(LIKE_EVENT_KEYS.CANCEL)
  async handleLikeCancelEvent(event: LikeCancelEvent) {
    if (LikeTargetNameList.findIndex(key => key === event.targetName) === -1) {
      this.logger.warn('取消点赞了未知的对象' + event)
      return;
    }

    if (event.attitude === LikeAttitude.dislike) {
      return;
    }

    const checkNotification = await this.notificationService.notificationModel.findOne({
      sender: new ObjectId(event.userId),
      type: NotificationType.Like,
      isUnread: true,
      'data.targetName': event.targetName,
      'data.targetId': event.targetId,
      'data.attitude': event.attitude,
    })

    if (checkNotification) {
      await this.notificationService.notificationModel.deleteOne({ _id: checkNotification._id });
    }
  }

  @OnEvent(FOLLOW_EVENT_KEYS.FOLLOW)
  async handleFollowEvent(event: FollowEvent) {
    const check = await this.notificationService.notificationModel.findOne({
      senderId: event.follower._id.toHexString(),
      recipient: event.following._id.toHexString(),
      type: NotificationType.Follow,
    })

    if (check) {
      return;
    }

    await this.notificationService.createNotification({
      senderId: event.follower._id.toHexString(),
      recipient: event.following._id.toHexString(),
      type: NotificationType.Follow,
      data: {},
    })
  }

  @OnEvent(COMMENT_EVENT_KEYS.COMMENT)
  async handleCommentEvent(event: CommentEvent) {
    if (CommentTargetNameList.findIndex(key => key === event.targetName) === -1) {
      this.logger.warn('评论了未知的对象，无法生成提醒:' + event)
      return;
    }

    if (event.targetName === 'Rate') {
      const rate = await this.rateService.rateModel
        .findById(event.targetId)
        .populate('mod')
      if (!rate) {
        this.logger.warn('评论了未知的评价，无法生成提醒:' + event)
        return;
      }

      if (rate.mod instanceof ObjectId) {
        this.logger.warn('评价mod产生未知错误:' + event)
        return;
      }

      const recipient = rate.user instanceof ObjectId ? rate.user.toHexString() : rate.user._id.toHexString();
      if (recipient === event.userId) {
        return;
      }

      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient,
        type: NotificationType.Comment,
        data: {
          _id: event._id,
          targetName: event.targetName,
          targetId: event.targetId,
          content: event.content,
          remark: rate.remark,
          mod: {
            _id: rate.mod._id.toHexString(),
            title: rate.mod.title,
          }
        },
      })
      return;
    }

    if (event.targetName === 'Topic') {
      const topic = await this.forumService.topicModel
        .findById(event.targetId)
        .populate('domain')
        
      
      if (!topic) {
        this.logger.warn('评论了未知的帖子，无法生成提醒:' + event)
        return;
      }

      if (topic.domain instanceof ObjectId) {
        this.logger.warn('帖子domain产生未知错误:' + event)
        return;
      }

      const recipient = topic.author instanceof ObjectId ? topic.author.toHexString() : topic.author._id.toHexString();
      if (recipient === event.userId) {
        return;
      }

      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient,
        type: NotificationType.Comment,
        data: {
          _id: event._id,
          targetName: event.targetName,
          targetId: event.targetId,
          content: event.content,
          topic: {
            title: topic.title,
          },
          domain: {
            _id: topic.domain._id.toHexString(),
            title: topic.domain.title,
          }
        },
      })
      return;
    }

    if (event.targetName === 'Collection') {
      const collection = await this.collectionService.collectionModel
        .findById(event.targetId)
        
      const recipient = getObjectId(collection.user).toHexString();
      if (recipient === event.userId) {
        return;
      }

      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient,
        type: NotificationType.Comment,
        data: {
          _id: event._id,
          targetName: event.targetName,
          targetId: event.targetId,
          content: event.content,
          collection: {
            _id: event.targetId,
            title: collection.name,
          },
        },
      })
    }
  }

  @OnEvent(COMMENT_EVENT_KEYS.REPLY)
  async handleReplyEvent(event: ReplyEvent) {
    const parent = await this.commentService.commentModel.findById(event.parent)
    const parentUser = parent.user instanceof ObjectId ? parent.user.toHexString() : parent.user._id.toHexString();

    if (!event.replyTo) {
      // 回复自己不发送提醒
      if (parentUser === event.userId) {
        return;
      }
  
      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient: parentUser,
        type: NotificationType.Reply,
        data: {
          _id: event._id,
          targetName: event.targetName,
          targetId: event.targetId,
          content: event.content,
          replyToContent: parent.content,
        },
      })

      return;
    }

    const replyTo = await this.commentService.commentModel.findById(event.replyTo)
    const replyToUser = replyTo.user instanceof ObjectId ? replyTo.user.toHexString() : replyTo.user._id.toHexString();

    if (replyToUser !== event.userId) {
      // 给replyTo发消息
      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient: replyToUser,
        type: NotificationType.Reply,
        data: {
          _id: event._id,
          targetName: event.targetName,
          targetId: event.targetId,
          content: event.content,
          replyToContent: replyTo.content,
        },
      })
    }

    if (parentUser !== event.userId && parentUser !== replyToUser) {
      // 给parent发提醒
      await this.notificationService.createNotification({
        senderId: event.userId,
        recipient: parentUser,
        type: NotificationType.Reply,
        data: {
          _id: event._id,
          targetName: event.targetName,
          targetId: event.targetId,
          content: event.content,
          replyToContent: parent.content,
        },
      })
    }


  }
}
