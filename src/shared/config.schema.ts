import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Config extends Document {
  @Prop()
  key: string;

  @Prop()
  value: any;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
