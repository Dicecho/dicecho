import { OperationLog as OperationLogDocument } from '@app/operationLog/schemas';
import { BaseSerializer, isInstanceArray } from '@app/core';
import { ObjectId } from 'mongodb';
import { Exclude, Expose } from 'class-transformer';

interface OperationLogSerializerCtx {
}

class OperationLogSerializer extends BaseSerializer<OperationLogDocument, OperationLogSerializerCtx> {
  constructor(
    partial: Partial<OperationLogDocument>,
    context: Partial<OperationLogSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  before: any = {};
  after: any = {};
  createdAt: Date = new Date();
  targetId: string = '';
  targetName: string = '';
  action: string = 'update';
  changedKeys: Array<string> = [];

  @Expose()
  get operator(): { _id: string; nickName: string; avatarUrl: string; } {
    if (this._obj.operator instanceof ObjectId ) {
      throw new Error('operation的user字段对象错误')
    }

    return {
      _id: this._obj.operator._id.toString(),
      nickName: this._obj.operator.nickName,
      avatarUrl: this._obj.operator.avatarUrl || `/avatars/${this._obj.operator.nickName}`,
    }
  }
}

export { OperationLogSerializer };