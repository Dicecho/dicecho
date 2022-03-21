import { BaseSerializer } from '@app/core';
import { User as UserDocument } from '@app/users/schemas/user.schema';
import { Expose } from 'class-transformer';
import { INoticeDto } from '../ineterface';
import { Notice as NoticeDocument } from '../schemas';

interface NoticeSerializerCtx {
  user?: UserDocument;
}

class NoticeSerializer
  extends BaseSerializer<NoticeDocument, NoticeSerializerCtx>
  implements INoticeDto {
  constructor(
    partial: Partial<NoticeDocument>,
    context: Partial<NoticeSerializerCtx> = {},
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
