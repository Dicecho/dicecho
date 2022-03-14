import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BaseDocument extends Document {
  @Prop({ type: Date, default: Date.now() })
  createdAt?: Date;

  @Prop({ type: Date, default: Date.now() })
  updatedAt?: Date;
}
