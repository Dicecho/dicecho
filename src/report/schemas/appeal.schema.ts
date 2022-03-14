import { BaseDocument } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Appeal extends BaseDocument {
  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
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
    type: String,
    required: true,
  })
  reason: string;

  @Prop({
    type: Number,
    default: 0,
  })
  status: number;

  @Prop({
    type: String,
    default: '',
  })
  rejectReason: string;
}

export const AppealSchema = SchemaFactory.createForClass(Appeal);
