import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseDocument } from '@app/core';

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class DomainCategory extends BaseDocument {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  title: string;

  @Prop({
    type: String,
  })
  coverUrl: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDefault: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
  })
  moderator: UserDocument | Types.ObjectId;
}

export const DomainCategorySchema = SchemaFactory.createForClass(DomainCategory);
