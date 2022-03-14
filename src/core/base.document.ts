import { Prop } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class BaseDocument extends Document {
  _id: Types.ObjectId;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  updatedAt: Date;
}
