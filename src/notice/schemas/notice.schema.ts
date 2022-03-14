import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import autopopulate from 'mongoose-autopopulate';
import _ from 'lodash';
import { BaseDocument } from '@app/core';


@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Notice extends BaseDocument {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  uniqueName: string;

  @Prop({
    type: String,
    required: true,
  })
  title: string;

  @Prop({
    type: String,
    default: '',
  })
  content: string;

  @Prop({
    default: false,
  })
  isPublic: boolean;

  @Prop({
    default: false,
  })
  isDeleted: boolean;
}

const NoticeSchema = SchemaFactory.createForClass(Notice);
NoticeSchema.plugin(autopopulate);

export { NoticeSchema }
