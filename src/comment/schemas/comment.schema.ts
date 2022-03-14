import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import autopopulate from 'mongoose-autopopulate';
import { ILikeable } from '@app/like/schemas';
import { BaseDocument } from '@app/core';

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Comment extends BaseDocument implements ILikeable {
  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
    autopopulate: true,
    required: true,
  })
  user: UserDocument | Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  targetId: string;

  @Prop({
    type: String,
    required: true,
  })
  targetName: string;

  @Prop({
    required: true,
  })
  content: string;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  updatedAt: Date;

  @Prop({
    type: Types.ObjectId,
    ref: Comment.name,
    required: false,
  })
  parent?: Comment | Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Comment.name,
    required: false,
    autopopulate: true,
  })
  replyTo?: Comment | Types.ObjectId;

  @Prop({})
  declareCounts: any;

  @Prop({ 
    type: [{ type: Types.ObjectId, ref: Comment.name }],
    default: [],
  })
  replies: Comment[] | Types.ObjectId[];

  @Prop({
    type: Number,
    default: 0,
  })
  repliesCount: number;

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

  @Prop({
    default: false,
  })
  isDeleted: boolean;
}

const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.plugin(autopopulate);

export { CommentSchema }