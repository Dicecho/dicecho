import { Comment as CommentDocument } from '@app/comment/schemas';
import { ObjectId } from 'mongodb';
import { Expose } from 'class-transformer';
import { BaseSerializer, serialize, isInstanceArray } from '@app/core';
import { LikeableCtx, LikeableSerializer } from '@app/like/serializers';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { toSimpleUser } from '@app/users/serializers';


export interface CommentSerializerCtx extends LikeableCtx {
  isReply: boolean;
  isSimple: boolean;
  user?: UserDocument;
}

@LikeableSerializer
class CommentSerializer extends BaseSerializer<CommentDocument, CommentSerializerCtx> {
  constructor(
    partial: Partial<CommentDocument>,
    context: Partial<CommentSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  targetId: string = '';
  targetName: string = '';
  createdAt: Date = new Date();

  likeCount: number = 0;
  repliesCount: number = 0;
  @Expose()
  isLiked: boolean;

  @Expose()
  get content() {
    return this._obj.isDeleted ? '此评论已被删除' : this._obj.content;
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  get replies() {
    if (this._context.isSimple || this._context.isReply) {
      return;
    }

    if (!this._obj.replies || this._obj.replies.length === 0) {
      return []
    }

    if (isInstanceArray(this._obj.replies, ObjectId)) {
      throw new Error('comment的replies字段对象错误')
    }

    return serialize(
      CommentSerializer,
      this._obj.replies,
      { 
        ...this._context,
        isReply: true,
      },
    )
  }

  @Expose()
  get user() {
    if (this._obj.user instanceof ObjectId) {
      throw new Error('comment的user字段对象错误')
    }

    return toSimpleUser(this._obj.user);
  }

  @Expose()
  get canEdit() {
    if (!this._context.user) {
      return false
    }

    if (this._context.user.checkRole('superuser')) {
      return true;
    }

    return this._context.user._id.equals(this.user._id);
  }

  @Expose()
  get replyTo() {
    if (this._context.isSimple) {
      return;
    }

    if (!this._context.isReply || !this._obj.replyTo) {
      return;
    }

    if (this._obj.replyTo instanceof ObjectId) {
      throw new Error('comment的replyTo字段对象错误')
    }

    return serialize(
      CommentSerializer,
      this._obj.replyTo,
      { 
        ...this._context,
        isReply: true,
        isSimple: true,
      },
    )
  }

  @Expose()
  get parentId() {
    if (!this._context.isReply) {
      return;
    }

    if (!this._obj.parent) {
      return this._id;
    }

    return this._obj.parent instanceof ObjectId ? this._obj.parent.toHexString() : this._obj.parent._id.toHexString()
  }
}

export { CommentSerializer }