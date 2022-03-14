import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Mod as ModDocument } from '@app/mod/schemas/mod.schema';
import autopopulate from 'mongoose-autopopulate';

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Replay extends Document {
  @Prop()
  owner: {
    mid: number;
    name: string;
    face: string;
    userId?: Types.ObjectId;
  };

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  bvid: string;

  @Prop({
    type: Number,
    default: 0,
  })
  duration: number;

  @Prop({
    type: Number,
    default: 1,
  })
  videos: number;

  @Prop()
  pages: Array<{
    page: number;
    part: string;
    duration: number;
  }>

  @Prop({
    type: Types.ObjectId,
    ref: ModDocument.name,
    autopopulate: true,
  })
  mod?: ModDocument | Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  title: string;

  @Prop({
    type: String,
    required: true,
  })
  coverUrl: string;

  @Prop({
    type: String,
    required: true,
  })
  description: string;

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

  @Prop({
    type: Boolean,
    default: false,
  })
  isRecommend: boolean;

  @Prop({
    type: Number,
    default: 0,
  })
  clickCount: number;
}

const ReplaySchema = SchemaFactory.createForClass(Replay);
ReplaySchema.plugin(autopopulate);

export { ReplaySchema };
