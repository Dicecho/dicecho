import { Document, HookNextFunction, Types } from 'mongoose';
import { loadClassMethods, BaseDocument } from '@app/core';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Pendant as PendantDocument } from './pendant.schema';
import autopopulate from 'mongoose-autopopulate';
import { isEmail, isUUID, isEnum } from 'class-validator';
import { Role } from '@app/auth/roles.enum';
import md5 from "md5";
import crypto from "crypto";

export const getRandomSalt = () => {
  return crypto.randomBytes(20).toString("hex");
};

export const calculatePassword = (password: string, salt: string) => {
  return md5(password + salt);
};

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class User extends BaseDocument {
  @Prop({
    maxlength: 255,
  })
  nickName: string;

  @Prop({
    default: '',
  })
  avatarUrl: string;

  @Prop({
    default: '',
  })
  backgroundUrl: string;

  @Prop({
    default: '',
  })
  note: string;

  @Prop({
    default: '',
  })
  notice: string;

  @Prop({
    default: 0,
  })
  likedCount: number;

  @Prop({
    default: 0,
  })
  rateCount: number;

  @Prop({
    default: 0,
  })
  contributionCount: number;

  @Prop({
    default: 0,
  })
  followerCount: number;

  @Prop({
    default: 0,
  })
  followingCount: number;

  @Prop({
    lowercase: true,
    validate: isEmail,
    maxlength: 255,
    required: [true, 'EMAIL_IS_BLANK'],
  })
  email: string;

  @Prop()
  password: string;

  @Prop()
  salt: string;

  @Prop({
    type: [String],
    default: [Role.User],
    validate: (value: Array<string>) => value.map(v => isEnum(v, Role)).filter(v => !v).length === 0,
  })
  roles: Role[];

  @Prop()
  verification: string;

  @Prop({
    default: false,
  })
  verified: boolean;

  @Prop({
    type: Date,
    default: Date.now,
  })
  verificationExpires: Date;

  @Prop({
    default: '',
  })
  rescueCode: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  rescueCodeExpires: Date;

  @Prop({
    type: Number,
    default: 0,
  })
  loginAttempts: number;

  @Prop({
    type: Date,
    default: Date.now,
  })
  blockExpires: Date;

  @Prop({ 
    type: Types.ObjectId,
    ref: PendantDocument.name,
    autopopulate: true,
  })
  activePendant?: PendantDocument | Types.ObjectId;

  @Prop({ 
    type: [{ type: Types.ObjectId, ref: PendantDocument.name }],
    default: [],
  })
  pendants: PendantDocument[] | Types.ObjectId[];

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  lastLoginAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  lastActivityAt: Date;

  async setPassword(
    password: string
  ): Promise<User> {
    const salt = getRandomSalt();
    const safePassword = calculatePassword(password, salt);
  
    this.salt = salt;
    this.password = safePassword;
    return this.save();
  };

  comparePassword(password: string): boolean {
    return this.password === calculatePassword(password, this.salt);
  };

  checkRole(role: string): boolean {
    return this.roles.findIndex(r => r === role) !== -1;
  };
}

const UserSchema = SchemaFactory.createForClass(User);

loadClassMethods(User, UserSchema);

UserSchema.pre('save', async function(next: HookNextFunction) {
  try {
    if (this.isModified('password')) {
      const salt = getRandomSalt();
      this.set("salt", salt);
      this.set("password", calculatePassword(this.get("password"), salt));
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

UserSchema.plugin(autopopulate);

export { UserSchema }
