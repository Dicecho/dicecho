import { Topic as TopicDocument } from '@app/forum/schemas';
// import { ITopicDto } from '@app/mod/dto/mod.dto';
import { ObjectId } from 'mongodb';
import { Mod as ModDocument } from '@app/mod/schemas';
import { ISimpleUser, toSimpleUser } from '@app/users/serializers';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer, isInstanceArray, serialize } from '@app/core';
import { LikeableCtx, LikeableSerializer, disLikeableSerializer, disLikeableCtx } from '@app/like/serializers';
import { Exclude, Expose } from 'class-transformer';
import { DEFAULT_COVER_URL } from '@app/shared/constants';


export interface ITopicDto {
  _id: string;
  isLiked: boolean;
  disLiked: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  lastCommentedAt: Date;
  title: string;
  content: string;
  readCount: number;
  isHighlight: boolean;
  isSpoiler: boolean;
  canEdit: boolean;
  domain: {
    _id: string;
    title: string;
    coverUrl: string;
  }
  author: ISimpleUser;
  relatedMods: Array<{
    _id: string;
    title: string,
    coverUrl: string,
    description: string,
    rateAvg: number,
    rateCount: number,
  }>;
}


interface TopicSerializerCtx extends LikeableCtx, disLikeableCtx {
  user?: UserDocument;
  mod?: ModDocument;
}

@disLikeableSerializer
@LikeableSerializer
class TopicSerializer extends BaseSerializer<TopicDocument, TopicSerializerCtx> implements ITopicDto {
  constructor(
    partial: Partial<TopicDocument>,
    context: Partial<TopicSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  likeCount: number = 0;
  commentCount: number = 0;
  createdAt: Date = new Date();
  lastCommentedAt: Date = new Date();
  title: string = '';
  content: string = '';
  readCount: number = 0;
  isHighlight: boolean = false;
  isSpoiler: boolean = false;

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }
  @Expose()
  isLiked: boolean;
  @Expose()
  disLiked: boolean;

  @Expose()
  get author() {
    if (this._obj.author instanceof ObjectId ) {
      throw new Error('topic的author字段对象错误')
    }
    
    return toSimpleUser(this._obj.author)
  }

  @Expose()
  get domain() {
    if (this._obj.domain instanceof ObjectId ) {
      throw new Error('topic的domain字段对象错误')
    }

    return {
      _id: this._obj.domain._id.toString(),
      title: this._obj.domain.title,
      coverUrl: this._obj.domain.coverUrl,
    }
  }

  @Expose()
  get relatedMods() {
    if (!this._obj.relatedMods || this._obj.relatedMods.length === 0) {
      return []
    }

    if (isInstanceArray(this._obj.relatedMods, ObjectId)) {
      throw new Error('topic的relatedMods字段对象错误')
    }

    return this._obj.relatedMods.map((mod) => ({
      _id: mod._id.toString(),
      title: mod.title,
      coverUrl: mod.coverUrl ? encodeURI(mod.coverUrl).replace(/\(/g, '\\(').replace(/\)/g, '\\)') : DEFAULT_COVER_URL,
      description: mod.description,
      rateAvg: (() => { 
        if (mod.rateCount && mod.rateCount < 5) {
          return 0
        }
    
        return mod.rateAvg ? parseFloat(mod.rateAvg.toFixed(1)) : 0;
      })(),
      rateCount: mod.rateCount || 0,
    }))
  }

  @Expose()
  get mod() {
    if (!this._context.mod) {
      return;
    }

    return {
      _id: this._context.mod._id.toString(),
      title: this._context.mod.title,
      coverUrl: this._context.mod.coverUrl ? encodeURI(this._context.mod.coverUrl).replace(/\(/g, '\\(').replace(/\)/g, '\\)') : DEFAULT_COVER_URL,
      description: this._context.mod.description,
      rateAvg: (() => { 
        if (this._context.mod.rateCount && this._context.mod.rateCount < 5) {
          return 0
        }
    
        return this._context.mod.rateAvg ? parseFloat(this._context.mod.rateAvg.toFixed(1)) : 0;
      })(),
      rateCount: this._context.mod.rateCount || 0,
    }
  }

  @Expose()
  get canEdit() {
    if (!this._context.user) {
      return false
    }

    return this._context.user._id.equals(this.author._id);
  }
}

export { TopicSerializer };