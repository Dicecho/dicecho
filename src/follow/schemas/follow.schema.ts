import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Follow extends Document {
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

export const FollowSchema = SchemaFactory.createForClass(Follow);
