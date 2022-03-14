import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Domain as DomainDocument } from './domain.schema';
import { isEmail, isUUID, isEnum } from 'class-validator';
import { BaseDocument } from '@app/core';
import { DomainRole } from '../constants';

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class DomainMember extends BaseDocument {
  @Prop({
    type: Types.ObjectId,
    ref: DomainDocument.name,
  })
  domain: DomainDocument | Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
  })
  user: UserDocument | Types.ObjectId;

  @Prop({
    type: [String],
    default: [DomainRole.Member],
    validate: (value: Array<string>) => value.map(v => isEnum(v, DomainRole)).filter(v => !v).length === 0,
  })
  roles: DomainRole[];

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
}

export const DomainMemberSchema = SchemaFactory.createForClass(DomainMember);
