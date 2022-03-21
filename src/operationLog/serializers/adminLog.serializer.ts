import { BaseSerializer } from '@app/core';
import { AdminLog as AdminLogDocument } from '@app/operationLog/schemas';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { toSimpleUser } from '@app/users/serializers';
import { Expose } from 'class-transformer';
import { ObjectId } from 'mongodb';

interface AdminLogSerializerCtx {
  user?: UserDocument;
}

class AdminLogSerializer extends BaseSerializer<
  AdminLogDocument,
  AdminLogSerializerCtx
> {
  constructor(
    partial: Partial<AdminLogDocument>,
    context: Partial<AdminLogSerializerCtx> = {},
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  log: string = '';
  message: string = '';
  createdAt: Date = new Date();
  targetName: string = '';
  type: any = '';
  snapshot: any = {};

  @Expose()
  get operator(): { _id: string; nickName: string; avatarUrl: string } {
    if (this._obj.operator instanceof ObjectId) {
      throw new Error('operation的user字段对象错误');
    }

    return toSimpleUser(this._obj.operator);
  }
}

export { AdminLogSerializer };