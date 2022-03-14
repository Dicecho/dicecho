import { ObjectId } from 'mongodb';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer, serialize, isInstanceArray } from '@app/core';
import { Collection as CollectionDocument } from '../schemas';
import { toSimpleUser, ISimpleUser } from '@app/users/serializers';
import { Exclude, Expose } from 'class-transformer';
import { DEFAULT_COVER_URL } from '@app/shared/constants';
import { ICollectionDto, AccessLevel, ICollectionItem } from '../ineterface';


interface CollectionSerializerCtx {
  user?: UserDocument;
}

class CollectionSerializer extends BaseSerializer<CollectionDocument, CollectionSerializerCtx> implements ICollectionDto {
  constructor(
    partial: Partial<CollectionDocument>,
    context: Partial<CollectionSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  name: string = '';
  description: string = '';
  coverUrl: string = '';
  items: Array<ICollectionItem> = [];
  isDefault: boolean = false;
  favoriteCount: number = 0;
  commentCount: number = 0;
  accessLevel: AccessLevel = AccessLevel.Private;
  createdAt: Date = new Date();

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  get canEdit() {
    if (this._obj.user instanceof ObjectId) {
      throw new Error('comment的user字段对象错误')
    }

    if (!this._context.user) {
      return false;
    }

    if (this._context.user._id.equals(this._obj.user._id)) {
      return true;
    }

    return false;
  }

  @Expose()
  get isFavorited() {
    if (!this._context.user) {
      return false;
    }

    let map = {}

    if (isInstanceArray(this._obj.favorites, ObjectId)) {
      map = this._obj.favorites.reduce((a, b) => ({
        ...a,
        [b.toHexString()]: true,
      }), {})
    } else {
      map = this._obj.favorites.reduce((a, b) => ({
        ...a,
        [b._id.toHexString()]: true,
      }), {})
    }

    return map[this._context.user._id.toHexString()] || false;
  }
  
  @Expose()
  get user() {
    if (this._obj.user instanceof ObjectId) {
      throw new Error('comment的user字段对象错误')
    }

    return toSimpleUser(this._obj.user)
  }
}

export { CollectionSerializer };