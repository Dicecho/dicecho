import { Pendant as PendantDocument } from '@app/users/schemas';
import { BaseSerializer } from '@app/core';
import { Expose } from 'class-transformer';

export class PendantSerializer extends BaseSerializer<PendantDocument, {}> {
  constructor(
    partial: Partial<PendantDocument>,
    context: Partial<{}> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  name: string = '';
  url: string = '';
}