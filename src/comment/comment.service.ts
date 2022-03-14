import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ForbiddenException } from '@app/core';
import { COMMENT_EVENT_KEYS } from './events';
import { ICommentable, Comment as CommentDocument } from './schemas';

@Injectable()
export class CommentService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel(CommentDocument.name) public readonly commentModel: Model<CommentDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  checkCommentEditPermission(comment: CommentDocument, user: UserDocument) {
    if (user.checkRole('superuser')) {
      return true;
    }

    return user._id.equals(comment.user instanceof ObjectId ? comment.user : comment.user._id)
  }

  async commentBy(
    targetName: string,
    targetId: string,
    userId: string,
    content: string,
  ) {
    const modelNames = this.connection.modelNames()
    if (!modelNames.find((name) => name === targetName)) {
      throw new NotFoundException('未知的对象')
    }

    const target = await this.connection.model<ICommentable>(targetName).findById(targetId);

    if (!target) {
      throw new NotFoundException('未找到对象')
    }

    const nComment = new this.commentModel({
      targetName,
      targetId,
      user: new ObjectId(userId),
      content,
    });

    await nComment.save();

    this.eventEmitter.emit(
      COMMENT_EVENT_KEYS.COMMENT,
      {
        _id: nComment._id.toHexString(),
        targetName,
        targetId,
        userId,
        content,
      },
    );

    await this.connection.model<ICommentable>(targetName).updateOne(
      { _id: new ObjectId(targetId) },
      { 
        $inc: { commentCount: 1 },
        $set: { lastCommentedAt: new Date() },
      },
      { upsert: true },
    )

    return nComment;
  }

  async replyTo(
    data: {
      commentId: string,
      userId: string,
      content: string,
    }
  ) {
    const {
      commentId,
      userId,
      content,
    } = data;
    const replyToComment = await this.commentModel.findById(commentId)

    if (!replyToComment) {
      throw new NotFoundException('未找到要回复的评论')
    }

    const nComment = new this.commentModel({
      targetName: replyToComment.targetName,
      targetId: replyToComment.targetId,
      user: new ObjectId(userId),
      content,
      parent: replyToComment.parent || replyToComment._id,
      replyTo: replyToComment.parent ? replyToComment._id : undefined,
    });

    await nComment.save();

    this.eventEmitter.emit(
      COMMENT_EVENT_KEYS.REPLY,
      {
        _id: nComment._id.toHexString(),
        targetName: nComment.targetName,
        targetId: nComment.targetId,
        userId,
        content,
        parent: nComment.parent,
        replyTo: nComment.replyTo,
      },
    );

    await this.commentModel.updateOne(
      { _id: replyToComment.parent || replyToComment._id },
      {
        $push: { replies: nComment._id },
        $inc: { repliesCount: 1 },
      },
      { upsert: true },
    )

    await this.connection.model<ICommentable>(replyToComment.targetName).updateOne(
      { _id: new ObjectId(replyToComment.targetId) },
      { $inc: { commentCount: 1 } },
      { upsert: true },
    )

    return nComment;
  }

  async deleteComment(comment: CommentDocument) {
    if (comment.isDeleted) {
      throw new NotFoundException('此评论已被删除')
    }

    comment.isDeleted = true;
    await comment.save()

    await this.connection.model<ICommentable>(comment.targetName).updateOne(
      { _id: new ObjectId(comment.targetId) },
      { $inc: { commentCount: -1 } },
      { upsert: true },
    )

    if (comment.parent) {
      await this.commentModel.updateOne(
        { _id: comment.parent },
        { $inc: { repliesCount: -1 } },
        { upsert: true },
      )
    }
  }
}
