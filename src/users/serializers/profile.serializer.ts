import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer } from '@app/core';
import { Expose } from 'class-transformer';
import { getObjectId } from '@app/utils';
import { ObjectId } from 'mongodb';
import { IUserDto } from '@app/interfaces/shared/api/user';
import { DEFAULT_ACCOUNT_BACKGROUND } from '@app/shared/constants';

interface ProfileCtx {
  user: UserDocument;
  userFollowedSet: Record<string, boolean>;
}

export class ProfileSerializer extends BaseSerializer<UserDocument, ProfileCtx> implements IUserDto {
  constructor(
    partial: Partial<UserDocument>,
    context: Partial<{}> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  nickName: string = '';
  notice: string = '';
  likedCount: number = 0;
  rateCount: number = 0;
  contributionCount: number = 0;
  followerCount: number = 0;
  followingCount: number = 0;

  @Expose()
  get pendantUrl() {
    if (!this._obj.activePendant) {
      return '';
    }
  
    if (this._obj.activePendant instanceof ObjectId) {
      return '';
    }

    if (!this._obj.pendants) {
      return '';
    }
    
    const pendantIds = (this._obj.pendants as Array<any>).map(getObjectId)
    const activeId = getObjectId(this._obj.activePendant)

    if (pendantIds.findIndex(id => id.equals(activeId)) === -1) {
      return '';
    }
  
    return this._obj.activePendant.url;
  }

  @Expose()
  get isFollowed() {
    if (!this._context.userFollowedSet) {
      return false;
    }

    return this._context.userFollowedSet[this._id]
  }

  @Expose()
  get roles() {
    if (!this._context.user) {
      return undefined;
    }
    if (!this._context.user._id.equals(this._obj._id)){
      return undefined;
    }

    return this._obj.roles;
  }

  @Expose()
  get email() {
    if (!this._context.user) {
      return undefined;
    }
    if (!this._context.user._id.equals(this._obj._id)){
      return undefined;
    }

    return this._obj.email;
  }

  @Expose()
  get note() {
    return this._obj.note || '暂无签名';
  }

  @Expose()
  get backgroundUrl() {

    return this._obj.backgroundUrl || DEFAULT_ACCOUNT_BACKGROUND
  }

  @Expose()
  get avatarUrl() {
    if (this._obj.avatarUrl) {
      return this._obj.avatarUrl;
    }

    return `/avatars/${this._obj.nickName}`
  }
}