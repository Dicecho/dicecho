import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseDocument } from '@app/core';
import { ReportClassification } from '../constants';

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Report extends BaseDocument {
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
  })
  targetReportedCode: string;

  @Prop({
    required: true,
  })
  classification: ReportClassification;

  @Prop({
    type: String,
    default: '',
  })
  reason: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
