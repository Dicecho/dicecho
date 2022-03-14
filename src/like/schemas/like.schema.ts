import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import _ from 'lodash';

export enum LikeAttitude {
  like = 'like',
  dislike = 'dislike',
  happy = 'happy',
}

export const AllAttitudes = [LikeAttitude.like, LikeAttitude.dislike, LikeAttitude.happy]
export const CompatibleAttitude = [LikeAttitude.happy]
export const UniqueAttitudes = _.xor(AllAttitudes, CompatibleAttitude)

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Like extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
    required: true,
  })
  user: UserDocument | Types.ObjectId;

  @Prop({
    required: true,
    default: LikeAttitude.like
  })
  attitude: LikeAttitude;


  @Prop({
    required: true,
    default: 1,
  })
  weight?: number;

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
    type: Date,
    default: () => new Date(),
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  updatedAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
