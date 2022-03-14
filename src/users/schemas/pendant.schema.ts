import { Types } from 'mongoose';
import { BaseDocument } from '@app/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Pendant extends BaseDocument {
  @Prop({ 
    type: String,
    required: true,
  })
  name: string;

  @Prop({ 
    type: String,
    required: true,
  })
  url: string;
}

const PendantSchema = SchemaFactory.createForClass(Pendant);

export { PendantSchema }
