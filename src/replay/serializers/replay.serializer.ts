import { BaseSerializer } from '@app/core';
import { IReplayDto } from '@app/replay/interface';
import { Replay as ReplayDocument } from '@app/replay/schemas';
import { DEFAULT_COVER_URL } from '@app/shared/constants';
import { Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';

export interface ReplaySerializerCtx {}

class ReplaySerializer
  extends BaseSerializer<ReplayDocument, ReplaySerializerCtx>
  implements IReplayDto {
  constructor(
    partial: Partial<ReplayDocument>,
    context: Partial<ReplaySerializerCtx> = {},
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  bvid: string = '';
  videos: number = 1;
  coverUrl: string = '';
  title: string = '';
  description: string = '';
  duration: number = 0;

  @Expose()
  get owner() {
    return {
      mid: this._obj.owner.mid,
      name: this._obj.owner.name,
      face: this._obj.owner.face,
    };
  }

  @Expose()
  get pages() {
    return this._obj.pages;
  }

  @Expose()
  get mod() {
    if (!this._obj.mod) {
      return;
    }

    if (this._obj.mod instanceof ObjectId) {
      throw new Error('replay的mod字段对象错误');
    }

    return {
      _id: this._obj.mod._id.toString(),
      title: this._obj.mod.title,
      coverUrl: this._obj.mod.coverUrl
        ? encodeURI(this._obj.mod.coverUrl)
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
        : DEFAULT_COVER_URL,
      description: this._obj.mod.description,
      rateAvg: (() => {
        if (this._obj.mod.rateCount && this._obj.mod.rateCount < 5) {
          return 0;
        }

        return this._obj.mod.rateAvg
          ? parseFloat(this._obj.mod.rateAvg.toFixed(1))
          : 0;
      })(),
      rateCount: this._obj.mod.rateCount || 0,
    };
  }
}

export { ReplaySerializer };
