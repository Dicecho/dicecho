import { Domain as DomainDocument } from '@app/forum/schemas';
// import { ITopicDto } from '@app/mod/dto/mod.dto';
import { ObjectId } from 'mongodb';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer, isInstanceArray } from '@app/core';
import { LikeableCtx, LikeableSerializer, disLikeableSerializer, disLikeableCtx } from '@app/like/serializers';
import { Exclude, Expose } from 'class-transformer';
import { DEFAULT_COVER_URL } from '@app/shared/constants';


export interface IDomainDto {
  _id: string;
  title: string;
  description: string;
  coverUrl: string;
  bannerUrl: string;
  rule: any;
  joined: boolean;
  isNSFW: boolean;
  moderators: Array<{
    _id: string;
    avatarUrl: string;
    nickName: string;
  }>;
  memberCount: number;
  topicCount: number;
  createdAt: Date;
}


interface DomainSerializerCtx {
  user?: UserDocument;
  joinedDomainIds?: Array<string>;
}

class DomainSerializer extends BaseSerializer<DomainDocument, DomainSerializerCtx> implements IDomainDto {
  constructor(
    partial: Partial<DomainDocument>,
    context: Partial<DomainSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  title: string = '';
  description: string = '';
  coverUrl: string = '';
  bannerUrl: string = '';
  rule: any = {};
  isNSFW: boolean = false;
  memberCount: number = 0;
  topicCount: number = 0;
  createdAt: Date = new Date();

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  get joined() {
    if (!this._context.joinedDomainIds) {
      return false;
    }

    const joinedMap = this._context.joinedDomainIds.reduce((a, b) => ({
      ...a,
      [b]: true,
    }), {})

    return joinedMap[this._id] || false;
  }
  
  @Expose()
  get moderators() {
    if (!Array.isArray(this._obj.moderators) || this._obj.moderators.length === 0) {
      return []
    }

    if (isInstanceArray(this._obj.moderators, ObjectId)) {
      throw new Error('domain的moderators字段对象错误')
    }

    return this._obj.moderators.map((user) => ({
      _id: user._id.toString(),
      nickName: user.nickName,
      avatarUrl: user.avatarUrl || `/avatars/${user.nickName}`,
    }))
  }
}

export { DomainSerializer };