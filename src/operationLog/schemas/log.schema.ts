import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '@app/core';
import { Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import autopopulate from 'mongoose-autopopulate';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class OperationLog extends BaseDocument {
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
    type: Types.ObjectId,
    ref: UserDocument.name,
    autopopulate: true,
  })
  operator: UserDocument | Types.ObjectId;

  @Prop({
    default: 'update',
  })
  action: string;

  @Prop({
    default: []
  })
  changedKeys: Array<string>;

  @Prop({
  })
  before: any;

  @Prop({
  })
  after: any;
}


const OperationLogSchema = SchemaFactory.createForClass(OperationLog);
OperationLogSchema.plugin(autopopulate);

export { OperationLogSchema }
