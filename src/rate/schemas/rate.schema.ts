import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, HookNextFunction } from 'mongoose';
import { Mod as ModDocument } from '@app/mod/schemas/mod.schema';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { RateType, AccessLevel, RemarkContentType } from '../constants';
import { IReportable } from '@app/report/schemas';
import { ILikeable } from '@app/like/schemas';
import { ICommentable } from '@app/comment/schemas';
import { BaseDocument } from '@app/core';
import autopopulate from 'mongoose-autopopulate';

export enum RateView {
  PL = 0,
  KP = 1,
  OB = 2,
}

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Rate extends BaseDocument implements ILikeable, ICommentable, IReportable {
  @Prop({
    type: Types.ObjectId,
    ref: ModDocument.name,
    required: true,
    autopopulate: true,
  })
  mod: ModDocument | Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
    required: true,
    autopopulate: true,
  })
  user: UserDocument | Types.ObjectId;

  @Prop({
    default: 0,
    required: true,
    min: 0,
    max: 10,
  })
  rate: number;

  @Prop({
    default: RateType.Rate,
    required: true,
  })
  type: RateType

  @Prop({
    default: '',
  })
  remark: string;

  @Prop({
    default: [],
  })
  richTextState: Array<any>;

  @Prop({
    default: RemarkContentType.Markdown,
  })
  remarkType: RemarkContentType;

  @Prop({
    default: AccessLevel.Public,
    required: true,
  })
  accessLevel: AccessLevel;

  @Prop({
    default: false,
  })
  isLocked: boolean;

  @Prop({
    default: 0,
  })
  remarkLength: number;

  @Prop({
    type: Number,
    default: 0,
  })
  view: RateView;

  @Prop({
    default: false,
  })
  isDeleted?: boolean;

  @Prop({
    type: Number,
    default: 0,
  })
  likeCount: number;

  @Prop({
    type: Number,
    default: 0,
  })
  dislikeCount: number;

  @Prop({})
  declareCounts: any;

  @Prop({
    type: Number,
    default: 0,
  })
  commentCount: number;

  @Prop({
    type: Number,
    default: 0,
  })
  spoilerCount: number;

  @Prop({
    type: Boolean,
    default: false, 
  })
  isAnonymous: boolean;

  @Prop({
    default: '',
  })
  reportedCode: string;

  @Prop({
    default: 0,
  })
  reportedCount: number;

  @Prop({
    default: '',
  })
  reportedReason: string;

  @Prop({
    default: 0,
  })
  weight: number;

  @Prop({
    default: 0,
  })
  wilsonScore: number;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  lastCommentedAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  rateAt: Date;
}

const RateSchema = SchemaFactory.createForClass(Rate);
RateSchema.plugin(autopopulate);

export { RateSchema }