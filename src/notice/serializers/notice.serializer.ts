import { ObjectId } from 'mongodb';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { BaseSerializer, serialize, isInstanceArray } from '@app/core';
import { Notice as NoticeDocument } from '../schemas';
import { SimpleUserSerializer, ISimpleUser } from '@app/users/serializers';
import { Exclude, Expose } from 'class-transformer';
import { DEFAULT_COVER_URL } from '@app/shared/constants';
import { INoticeDto, AccessLevel, INoticeItem } from '../ineterface';


interface NoticeSerializerCtx {
  user?: UserDocument;
}

class NoticeSerializer extends BaseSerializer<NoticeDocument, NoticeSerializerCtx> implements INoticeDto {
  constructor(
    partial: Partial<NoticeDocument>,
    context: Partial<NoticeSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  title: string = '';
  content: string = '';

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }
}

export { NoticeSerializer };