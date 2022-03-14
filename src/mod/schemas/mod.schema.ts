import { BaseDocument } from '@app/core';
import { IReportable } from '@app/report/schemas';
// import { Domain as DomainDocument } from '@app/forum/schemas'
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import autopopulate from 'mongoose-autopopulate';
import mongoosePaginate from 'mongoose-paginate';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Mod extends BaseDocument implements IReportable {
  @Prop({
    required: true,
  })
  title: string;

  @Prop({
    default: '',
  })
  originTitle: string;

  @Prop({
    default: '',
  })
  alias: string;

  @Prop({
    default: '',
  })
  description: string;

  @Prop({
    default: '',
  })
  coverUrl: string;

  @Prop({
    default: '',
  })
  origin: string; // 来源， 本站/cnmods/booth

  @Prop({
    default: '',
  })
  originUrl: string;

  @Prop({
    default: [],
  })
  imageUrls: Array<string>;

  @Prop({
    type: Types.Array,
    default: [0, 0],
  })
  playerNumber: [number, number];

  @Prop({
    required: function() {
      return this.origin === 'booth';
    },
  })
  boothAliaseId?: number;

  @Prop({
    required: function() {
      return this.origin === 'cnmods';
    },
  })
  cnmodsAliaseId?: number;

  @Prop({
    required: true,
  })
  moduleRule: string;

  @Prop()
  moduleDownloadUrl?: string;

  @Prop({
    type: Array,
    default: [],
  })
  relatedLinks: Array<{
    name: string;
    url: string;
    clickCount: number;
  }>;

  @Prop({
    type: Array,
    default: [],
  })
  modFiles: Array<{
    name: string;
    size: number;
    url: string;
    type: string;
    clickCount?: number;
  }>;

  @Prop({
    type: Array,
    default: [],
  })
  tags: Array<string>;

  @Prop({
    default: () => new Date(),
  })
  releaseDate: Date;

  @Prop({
    type: Types.ObjectId,
    ref: UserDocument.name,
    autopopulate: true,
  })
  author?: UserDocument | Types.ObjectId;

  @Prop({
    type: [
      {
        type: Types.ObjectId,
        ref: UserDocument.name,
      },
    ],
    default: [],
    autopopulate: true,
  })
  contributors: UserDocument[] | Types.ObjectId[];

  @Prop({
    type: [Types.ObjectId],
    ref: UserDocument.name,
    default: [],
  })
  editors: UserDocument[] | Types.ObjectId[];

  @Prop()
  foreignAuthor?: {
    id?: string;
    avatarUrl?: string;
    nickName: string;
  };

  @Prop()
  languages: string[];

  @Prop({
    default: 0,
  })
  rateAvg: number;

  @Prop({
    default: 0,
  })
  validRateCount: number;

  @Prop({
    default: 0,
  })
  replayCount: number;

  @Prop({
    default: 0,
  })
  topicCount: number;

  @Prop({
    default: 0,
  })
  rateCount: number;

  @Prop({
    default: 0,
  })
  markCount: number;

  @Prop({})
  rateInfo: any;

  @Prop({
    default: true,
  })
  isForeign: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  isNSFW: boolean;

  @Prop({
    default: false,
  })
  invalid: boolean;

  @Prop({
    default: 0,
  })
  invalidReportCount: number;

  @Prop({
    type: Date,
  })
  lastRateAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  lastEditAt: Date;

  @Prop({
    default: '',
  })
  reportedCode: string;

  @Prop({
    default: 0,
  })
  reportedCount: number;

  @Prop({
    default: '',
  })
  reportedReason: string;
}

const ModSchema = SchemaFactory.createForClass(Mod);
ModSchema.plugin(mongoosePaginate);
ModSchema.plugin(autopopulate);

export { ModSchema };
