import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Types } from 'mongoose';
import { BaseDocument } from '@app/core';

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
})
export class Tag extends BaseDocument {
  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  name: string;

  @Prop({
    type: String,
    default: '',
  })
  coverUrl: string;

  @Prop({
    type: String,
    default: '',
  })
  description: string;

  @Prop({
    type: Number,
    default: 0,
  })
  modCount: number;

  @Prop({
    type: Number,
    default: 0,
  })
  topicCount: number;

  @Prop({
    type: [{ 
      type: Types.ObjectId, 
      ref: UserDocument.name,
    }],
    default: [],
  })
  contributors: UserDocument[] | Types.ObjectId[];

  @Prop({
    type: Boolean,
    default: false,
  })
  isCategory: boolean;

  @Prop({
    type: Array,
    default: []
  })
  parents: Array<string>;

  @Prop({
    type: Array,
    default: []
  })
  children: Array<string>;

  @Prop({
    type: Array,
    default: []
  })
  alias: Array<string>;

  // @Prop({ 
  //   type: [{ type: Types.ObjectId, ref: Tag.name }],
  //   default: [],
  // })
  // children: Tag[] | Types.ObjectId[];
}

export const TagSchema = SchemaFactory.createForClass(Tag);
