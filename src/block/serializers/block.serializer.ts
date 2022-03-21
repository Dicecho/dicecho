import { BaseSerializer, serialize } from '@app/core';
import { IModDto } from '@app/mod/dto';
import { Mod as ModDocument } from '@app/mod/schemas';
import { ModSerializer } from '@app/mod/serializers';
import { IRateDto } from '@app/rate/dto';
import { Rate as RateDocument } from '@app/rate/schemas';
import { RateSerializer } from '@app/rate/serializers';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { toSimpleUser } from '@app/users/serializers';
import { Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { BlockTargetName } from '../interface';
import { Block as BlockDocument } from '../schemas';

interface BlockSerializerCtx {
  user?: UserDocument;
}

class BlockSerializer extends BaseSerializer<
  BlockDocument,
  BlockSerializerCtx
> {
  constructor(
    partial: Partial<BlockDocument>,
    context: Partial<BlockSerializerCtx> = {},
  ) {
    super(partial, context);
    this.assignObject(partial);
  }
  targetName: string = '';

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  get target() {
    if (!this._obj.target) {
      return null;
    }

    if (this._obj.target instanceof ObjectId) {
      throw new Error('block的target字段对象错误');
    }

    if (this._obj.targetName === BlockTargetName.Mod) {
      return serialize(ModSerializer, this._obj.target as ModDocument, {
        user: this._context.user,
      }) as IModDto;
    }

    if (this._obj.targetName === BlockTargetName.Rate) {
      return serialize(RateSerializer, this._obj.target as RateDocument, {
        user: this._context.user,
      }) as IRateDto;
    }

    if (this._obj.targetName === BlockTargetName.User) {
      return toSimpleUser(this._context.user);
    }

    throw null;
  }
}

export { BlockSerializer };
