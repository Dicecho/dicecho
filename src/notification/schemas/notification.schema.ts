import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseDocument } from '@app/core';

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Notification extends BaseDocument {
  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
  })
  sender: UserDocument | Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
    required: true,
  })
  recipient: UserDocument | Types.ObjectId;

  @Prop({
    default: '',
  })
  type: string;

  @Prop({
    type: {},
    default: {},
  })
  data: any;

  @Prop({
    default: true,
  })
  isUnread: boolean;

  @Prop({
    default: false,
  })
  isDeleted: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
