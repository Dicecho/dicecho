import { Tag as TagDocument } from '@app/tag/schemas';
import { BaseSerializer } from '@app/core';
import { Expose } from 'class-transformer';

interface TagSerializerCtx {
}

class TagSerializer extends BaseSerializer<TagDocument, TagSerializerCtx> {
  constructor(
    partial: Partial<TagDocument>,
    context: Partial<TagSerializerCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }
  name: string = '';
  coverUrl: string = '';
  description: string = '';
  modCount: number = 0;
  topicCount: number = 0;
  isCategory: boolean = false;
  parents: Array<string> = [];
  children: Array<string> = [];
  alias: Array<string> = [];

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }
}

export { TagSerializer };