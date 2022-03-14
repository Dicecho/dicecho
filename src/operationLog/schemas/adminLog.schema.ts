import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '@app/core';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import autopopulate from 'mongoose-autopopulate';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class AdminLog extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
    autopopulate: true,
  })
  operator: UserDocument | Types.ObjectId;

  @Prop({})
  type: string;

  @Prop({})
  snapshot: any;

  @Prop({
    default: '',
  })
  log: string;

  @Prop({
    default: '',
  })
  message: string;

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


const AdminLogSchema = SchemaFactory.createForClass(AdminLog);
AdminLogSchema.plugin(autopopulate);

export { AdminLogSchema }
