import { BaseSerializer, Constructor } from '@app/core';

export interface FollowableCtx {
  userFollowIds: Array<string>;
}

export function FollowableSerializer<TBase extends Constructor<BaseSerializer<unknown, FollowableCtx>>>(Base: TBase) {
  return class extends Base {
    _id: string;
    followCount: number;

    get isFollowd() {
      if (!this._context) {
        return false;
      }
  
      if (!this._context.userFollowIds || this._context.userFollowIds.length === 0) {
        return false;
      }
  
      return this._context.userFollowIds.findIndex(id => id === this._id) !== -1
    }
  };
}

export interface unfollowableCtx {
  userunfollowIds: Array<string>;
}


export function unfollowableSerializer<TBase extends Constructor<BaseSerializer<unknown, unfollowableCtx>>>(Base: TBase) {
  return class extends Base {
    _id: string;

    get unfollowd() {
      if (!this._context) {
        return false;
      }
  
      if (!this._context.userunfollowIds || this._context.userunfollowIds.length === 0) {
        return false;
      }
  
      return this._context.userunfollowIds.findIndex(id => id === this._id) !== -1
    }
  };
}

