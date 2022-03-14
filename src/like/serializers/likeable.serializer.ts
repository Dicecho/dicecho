import { BaseSerializer, Constructor } from '@app/core';
import { LikeAttitude } from '../schemas';
import _ from 'lodash';

export interface LikeableCtx {
  userLikeIds: Array<string>;
}

export function LikeableSerializer<TBase extends Constructor<BaseSerializer<unknown, LikeableCtx>>>(Base: TBase) {
  return class extends Base {
    _id: string;
    likeCount: number;

    get isLiked() {
      if (!this._context) {
        return false;
      }
  
      if (!this._context.userLikeIds || this._context.userLikeIds.length === 0) {
        return false;
      }
  
      return this._context.userLikeIds.findIndex(id => id === this._id) !== -1
    }
  };
}

export interface disLikeableCtx {
  userdisLikeIds: Array<string>;
}


export function disLikeableSerializer<TBase extends Constructor<BaseSerializer<unknown, disLikeableCtx>>>(Base: TBase) {
  return class extends Base {
    _id: string;

    get disLiked() {
      if (!this._context) {
        return false;
      }
  
      if (!this._context.userdisLikeIds || this._context.userdisLikeIds.length === 0) {
        return false;
      }
  
      return this._context.userdisLikeIds.findIndex(id => id === this._id) !== -1
    }
  };
}


export interface DecalreableCtx {
  countKeys: Partial<{
    include: Array<string>;
    exclude: Array<string>;
    type: 'whitelist' | 'blacklist';
  }>;
  statusKeys: Partial<{
    include: Array<string>;
    exclude: Array<string>;
    type: 'whitelist' | 'blacklist';
  }>;
  userDeclareMap: {
    [id: string]: Array<LikeAttitude>;
  };
}

export function DecalreableSerializer<TBase extends Constructor<BaseSerializer<unknown, DecalreableCtx>>>(Base: TBase) {
  return class extends Base {
    _id: string;
    _obj: any;
    _context: DecalreableCtx;

    get declareCounts(): { [key in string]: number } {
      const keys = (() => {
        if (!this._obj || !this._obj.declareCounts) {
          return []
        }

        if (!this._context || !this._context.countKeys) {
          return Object.keys(this._obj.declareCounts);
        }

        if (this._context.countKeys.type === 'whitelist') {
          return this._context.countKeys.include;
        }

        const all = _.union(this._context.countKeys.include, Object.keys(this._obj.declareCounts));

        return _.pullAll(all, (this._context.countKeys.exclude || []));
      })()

      if (keys.length === 0) {
        return {};
      }

      return keys.reduce((a, b) => ({
        ...a,
        [b]: this._obj.declareCounts[b] || 0,
      }), {})
    }

    get declareStatus(): { [key in string]: boolean } {
      const keys = (() => {
        if (!this._obj || !this._obj.declareCounts) {
          return []
        }

        if (!this._context || !this._context.statusKeys) {
          return Object.keys(this._obj.declareCounts);
        }

        if (this._context.statusKeys.type === 'whitelist') {
          return this._context.statusKeys.include;
        }

        const all = _.union(this._context.statusKeys.include, Object.keys(this._obj.declareCounts));

        return _.pullAll(all, (this._context.statusKeys.exclude || []));
      })()

      if (keys.length === 0) {
        return {};
      }

      if (!this._context || !this._context.userDeclareMap || !this._context.userDeclareMap[this._id]) {
        return keys.reduce((a, b) => ({
          ...a,
          [b]: false,
        }), {})
      }

      const declareMap = this._context.userDeclareMap[this._id].reduce((a, b) => ({
        ...a,
        [b]: true,
      }), {})

      return keys.reduce((a, b) => ({
        ...a,
        [b]: declareMap[b] || false,
      }), {})
    }
  };
}
