import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { DomainCategory as DomainCategoryDocument } from './domainCategory.schema';
import autopopulate from 'mongoose-autopopulate';
import { BaseDocument } from '@app/core';

@Schema({ 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Domain extends BaseDocument {
  @Prop({
    type: String,
    required: true,
  })
  title: string;

  @Prop({
    type: String,
    default: '',
  })
  description: string;

  @Prop({
    type: String,
  })
  coverUrl: string;

  @Prop({
    type: String,
  })
  bannerUrl: string;

  /*
    rule: {
      // 加入规则
      // 需求
      join: 'open' | 'invitate' | 'verify' | 'closed',
      post: {
        read: 'all' | 'member',
        anonymous: 'allow' | 'must' | 'prohibit',
        create: 'all' | 'member',
        delete: 'all' | 'moderators',
      },
      reply: {
        anonymous: 'allow' | 'must' | 'prohibit',
        create: 'all' | 'member',
      },
    }
  */
  @Prop({
  })
  rule: any;

  @Prop({
    type: Boolean,
    default: false,
  })
  isNSFW: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRecommend: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: Domain.name,
    required: false,
  })
  parent?: Domain | Types.ObjectId;

  @Prop({ 
    type: [{ type: Types.ObjectId, ref: Domain.name }],
    default: [],
  })
  children: Domain[] | Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: DomainCategoryDocument.name,
  })
  category: DomainCategoryDocument | Types.ObjectId;

  @Prop({
    type: [{ 
      type: Types.ObjectId, 
      ref: UserDocument.name,
    }],
    default: [],
    autopopulate: true,
  })
  moderators: UserDocument[] | Types.ObjectId[];

  @Prop({
    default: 0,
  })
  memberCount: number;

  @Prop({
    default: 0,
  })
  topicCount: number;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  lastActivityAt: Date;

  @Prop({
    default: false,
  })
  isDeleted: boolean;
}

const DomainSchema = SchemaFactory.createForClass(Domain);
DomainSchema.plugin(autopopulate);

export { DomainSchema }