import { ObjectId } from 'mongodb';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer, serialize, isInstanceArray } from '@app/core';
import { Block as BlockDocument } from '../schemas';
import { SimpleUserSerializer, ISimpleUser } from '@app/users/serializers';
import { ModSerializer } from '@app/mod/serializers';
import { Mod as ModDocument } from '@app/mod/schemas'
import { Rate as RateDocument } from '@app/rate/schemas'
import { RateSerializer } from '@app/rate/serializers';
import { Exclude, Expose } from 'class-transformer';
import { IModDto } from '@app/mod/dto';
import { IRateDto } from '@app/rate/dto';
import { IBlockDto, BlockTargetName } from '../interface';


interface BlockSerializerCtx {
  user?: UserDocument;
}

class BlockSerializer extends BaseSerializer<BlockDocument, BlockSerializerCtx> {
  constructor(
    partial: Partial<BlockDocument>,
    context: Partial<BlockSerializerCtx> = { },
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
      throw new Error('block的target字段对象错误')
    }

    if (this._obj.targetName === BlockTargetName.Mod) {
      return serialize(
        ModSerializer,
        this._obj.target as ModDocument,
        { user: this._context.user },
      ) as IModDto
    }

    if (this._obj.targetName === BlockTargetName.Rate) {
      return serialize(
        RateSerializer,
        this._obj.target as RateDocument,
        { user: this._context.user },
      ) as IRateDto
    }

    if (this._obj.targetName === BlockTargetName.User) {
      return serialize(
        SimpleUserSerializer,
        this._obj.target as UserDocument,
        { user: this._context.user },
      ) as ISimpleUser
    }

    throw null
  }
}

export { BlockSerializer };