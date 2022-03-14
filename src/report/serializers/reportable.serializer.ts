import { BaseSerializer, Constructor } from '@app/core';

export interface ReportableCtx {
}

export function ReportableSerializer<TBase extends Constructor<BaseSerializer<unknown, ReportableCtx>>>(Base: TBase) {
  return class extends Base {
    _id: string;
    reportedCount: number;
    reportedReason: string;
  };
}
