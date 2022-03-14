import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Mod as ModDocument } from '@app/mod/schemas/mod.schema';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { DomainCategory as DomainCategoryDocument } from './domainCategory.schema';
import { Domain as DomainDocument } from './domain.schema';
import { IReportable } from '@app/report/schemas';
import { BaseDocument } from '@app/core';
import { ICommentable } from '@app/comment/schemas';
import { ILikeable } from '@app/like/schemas';
import { StickLevel, TopicContentType } from '../constants'; 

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Topic extends BaseDocument implements ILikeable, ICommentable {
  @Prop({
    type: String,
    required: true,
  })
  title: string;

  @Prop({
    type: Types.ObjectId,
    ref: DomainDocument.name,
  })
  domain: DomainDocument | Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: ModDocument.name }],
    default: [],
  })
  relatedMods: Array<ModDocument> | Array<Types.ObjectId>;

  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
  })
  author: UserDocument | Types.ObjectId;

  @Prop({
    type: String,
    default: '',
  })
  content: string;
  
  @Prop({
    type: String,
    default: TopicContentType.Text,
  })
  contentType: TopicContentType;

  @Prop({
    type: Boolean,
    default: false,
  })
  isSpoiler: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isNSFW: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isLocked: boolean;

  @Prop({
    type: Array,
    default: []
  })
  tags: Array<string>;

  @Prop({
    type: Boolean,
    default: false,
  })
  isHighlight: boolean;

  @Prop({
    type: Number,
    default: StickLevel.None,
  })
  stickLevel: StickLevel;

  @Prop({
    type: Number,
    default: 0,
  })
  readCount: number;

  @Prop({
    type: Number,
    default: 0,
  })
  commentCount: number;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  lastCommentedAt: Date;

  @Prop({
    default: false,
  })
  isDeleted: boolean;

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
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
