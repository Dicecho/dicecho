import { Document, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from '@app/users/schemas/user.schema';

@Schema({
  timestamps: true,
})
export class RefreshToken {

  @Prop({
    required: true,
  })
  user: string;

  @Prop({
    required: true,
  })
  refreshToken: string;

  @Prop({
    required: true,
    default: false,
  })
  valid: boolean;

  @Prop({
    required: true,
    default: () => new Date(),
  })
  expiredAt: Date;

  @Prop({
    required: true,
  })
  ip: string;

  @Prop({
    required: true,
  })
  browser: string;

  @Prop({
    required: true,
  })
  country: string;
}

export type RefreshTokenDocument = RefreshToken & Document;

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
