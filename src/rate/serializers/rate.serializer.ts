import { 
  Rate as RateDocument,
} from '@app/rate/schemas';
import { ObjectId } from 'mongodb';
import { Expose } from 'class-transformer';
import { BaseSerializer, serialize } from '@app/core';
import { toSimpleUser } from '@app/users/serializers';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { 
  LikeableCtx, LikeableSerializer,
  disLikeableSerializer, disLikeableCtx,
  DecalreableSerializer, DecalreableCtx,
} from '@app/like/serializers';
import { ReportableSerializer, ReportableCtx } from '@app/report/serializers';
import { IRateDto } from '@app/rate/dto/rate.dto';
import { DEFAULT_COVER_URL } from '@app/shared/constants';
import md5 from "md5";
import { RateType, AccessLevel, RemarkContentType } from '../constants';

export interface RateSerializerCtx extends LikeableCtx, disLikeableCtx, ReportableCtx, DecalreableCtx {
  user: UserDocument;
}

@DecalreableSerializer
@ReportableSerializer
@disLikeableSerializer
@LikeableSerializer
class RateSerializer extends BaseSerializer<RateDocument, RateSerializerCtx> {
  constructor(
    partial: Partial<RateDocument>,
    context: Partial<RateSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  rate: number = 0;
  remark: string = '';
  rateAt: Date = new Date();
  createdAt: Date = new Date();
  isAnonymous: boolean = false;

  @Expose()
  isLiked: boolean;
  @Expose()
  disLiked: boolean;

  @Expose()
  declareCounts: { [key: string]: number };
  @Expose()
  declareStatus: { [key: string]: boolean };

  likeCount: number = 0;
  commentCount: number = 0;
  spoilerCount: number = 0;
  reportedCount: number = 0;
  reportedReason: string = '';
  remarkLength: number = 0;
  type: RateType = RateType.Rate; 
  accessLevel: AccessLevel = AccessLevel.Public;

  @Expose()
  get richTextState() {
    return this._obj.richTextState || []
  }

  @Expose()
  get remarkType() {
    return this._obj.remarkType || RemarkContentType.Markdown;
  }

  @Expose()
  get canEdit() {
    if (!this._context.user) {
      return false;
    }

    if (this._obj.user instanceof ObjectId ) {
      throw new Error('rate的user字段对象错误')
    }

    if (this._context.user.checkRole('superuser')) {
      return true;
    }
    
    return this._obj.user._id.equals(this._context.user._id)
  }


  @Expose()
  get view() {
    return this._obj.view || 0;
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  get user() {
    if (this._obj.user instanceof ObjectId ) {
      throw new Error('rate的user字段对象错误')
    }
    
    if (this._obj.isAnonymous) {
      return {
        _id: md5(this._obj.user._id.toString()),
        nickName: '匿名用户',
        avatarUrl: 'https://file.dicecho.com/images/qweeraahrx.jpeg',
        pendantUrl: '',
      }
    }

    return toSimpleUser(this._obj.user);
  }

  @Expose()
  get mod() {
    if (this._obj.mod instanceof ObjectId) {
      throw new Error('rate的mod字段对象错误')
    }


    return {
      _id: this._obj.mod._id.toString(),
      title: this._obj.mod.title,
      coverUrl: this._obj.mod.coverUrl ? encodeURI(this._obj.mod.coverUrl).replace(/\(/g, '\\(').replace(/\)/g, '\\)') : DEFAULT_COVER_URL,
      description: this._obj.mod.description,
      rateAvg: (() => { 
        if (this._obj.mod.rateCount && this._obj.mod.rateCount < 5) {
          return 0
        }
    
        return this._obj.mod.rateAvg ? parseFloat(this._obj.mod.rateAvg.toFixed(1)) : 0;
      })(),
      rateCount: this._obj.mod.rateCount || 0,
    }
  }
}

export { RateSerializer }