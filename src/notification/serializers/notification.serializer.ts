import { ObjectId } from 'mongodb';
import { Expose } from 'class-transformer';
import { BaseSerializer } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Notification as NotificationDocument } from '@app/notification/schemas';
import { NotificationType } from '../constants';

export interface NotificationSerializerCtx {
  user: UserDocument;
}

class NotificationSerializer extends BaseSerializer<NotificationDocument, NotificationSerializerCtx> {
  constructor(
    partial: Partial<NotificationDocument>,
    context: Partial<NotificationSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  type: NotificationType = NotificationType.Like;
  data: any = {};
  isUnread: boolean = true;
  createdAt: Date = new Date();

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  get recipient() {
    if (this._obj.recipient instanceof ObjectId ) {
      throw new Error('notification的recipient字段对象错误')
    }

    return {
      _id: this._obj.recipient._id.toString(),
      nickName: this._obj.recipient.nickName,
      avatarUrl: this._obj.recipient.avatarUrl || `/avatars/${this._obj.recipient.nickName}`,
    }
  }

  @Expose()
  get sender() {
    if (!this._obj.sender) {
      return undefined;
    }
  
    if (this._obj.sender instanceof ObjectId ) {
      throw new Error('notification的sender字段对象错误')
    }

    return {
      _id: this._obj.sender._id.toString(),
      nickName: this._obj.sender.nickName,
      avatarUrl: this._obj.sender.avatarUrl || `/avatars/${this._obj.sender.nickName}`,
    }
  }


}

export { NotificationSerializer }