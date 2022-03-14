import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import autopopulate from 'mongoose-autopopulate';
import { ICommentable } from '@app/comment/schemas';
import _ from 'lodash';
import { BaseDocument } from '@app/core';
import { AccessLevel } from '../ineterface';


@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Collection extends BaseDocument implements ICommentable {
  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
    autopopulate: true,
    required: true,
  })
  user: UserDocument | Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: UserDocument.name }],
    default: [],
  })
  favorites: UserDocument[] | Types.ObjectId[];

  @Prop({
    type: Number,
    default: 0,
  })
  favoriteCount: number;

  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    default: '',
  })
  description: string;

  @Prop({
    type: String,
    default: '',
  })
  coverUrl: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRecommend: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDefault: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;

  @Prop({
    type: String,
    default: AccessLevel.Private,
    required: true,
  })
  accessLevel: AccessLevel;

  @Prop({
    type: Array,
    default: [],
  })
  items: Array<{
    targetName: string,
    targetId: string,
    order?: number,
  }>;

  @Prop({
    type: Number,
    default: 0,
  })
  itemCount: number;

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
}

const CollectionSchema = SchemaFactory.createForClass(Collection);
CollectionSchema.plugin(autopopulate);

export { CollectionSchema }
