import { BaseSerializer, Constructor } from '@app/core';

export function Commentable<TBase extends Constructor<BaseSerializer<unknown, unknown>>>(Base: TBase) {
  return class extends Base {
    commentCount: number;
  };
}
