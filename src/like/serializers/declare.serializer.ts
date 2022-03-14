import { Expose } from 'class-transformer';
import { BaseSerializer } from '@app/core';
import { DecalreableSerializer, DecalreableCtx } from './likeable.serializer';
import { ILikeable } from '@app/like/schemas';

@DecalreableSerializer
class DeclareSerializer extends BaseSerializer<ILikeable, DecalreableCtx> {
  constructor(
    partial: Partial<ILikeable>,
    context: Partial<DecalreableCtx> = { },
  ) {
    super(partial, context);
    this.assignObject(partial);
  }

  @Expose()
  get _id() {
    return this._obj._id.toString();
  }

  @Expose()
  declareCounts: { [key: string]: number };
  @Expose()
  declareStatus: { [key: string]: boolean };
}

export { DeclareSerializer }