import { Types } from 'mongoose';
import { BaseDocument } from '@app/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User as UserDocument } from './user.schema';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Follow extends BaseDocument {

  @Prop({ 
    type: Types.ObjectId,
    ref: UserDocument.name,
    required: true,
  })
  follower: UserDocument | Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId,
    ref: UserDocument.name,
    required: true,
  })
  following: UserDocument | Types.ObjectId;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
