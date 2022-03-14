import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer } from '@app/core';
import { ObjectId } from 'mongodb';
import { getObjectId } from '@app/utils';
import { Expose } from 'class-transformer';

export interface ISimpleUser {
  _id: string;
  nickName: string;
  avatarUrl: string;
  pendantUrl: string;
}

export function toSimpleUser(user: UserDocument): ISimpleUser {
  const pendantUrl = (() => {
    if (!user.activePendant) {
      return '';
    }
  
    if (user.activePendant instanceof ObjectId) {
      return '';
    }

    if (!user.pendants) {
      return '';
    }
    
    const pendantIds = (user.pendants as Array<any>).map(getObjectId)
    const activeId = getObjectId(user.activePendant)

    if (pendantIds.findIndex(id => id.equals(activeId)) === -1) {
      return '';
    }
  
    return user.activePendant.url;
  })()

  const avatarUrl = (() => {
    if (user.avatarUrl) {
      return user.avatarUrl;
    }
    return `/avatars/${user.nickName}`
  })()

  return {
    _id: user._id.toString(),
    nickName: user.nickName || '',
    pendantUrl,
    avatarUrl,
  }
}


export class SimpleUserSerializer extends BaseSerializer<UserDocument, {}> {
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
  get avatarUrl() {
    if (this._obj.avatarUrl) {
      return this._obj.avatarUrl;
    }

    return `/avatars/${this._obj.nickName}`
  }
}