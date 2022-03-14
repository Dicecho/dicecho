import { Constructor } from '@app/core';
import { Document } from 'mongoose';

export interface IReportable extends Document {
  reportedCode: string;
  reportedCount: number;
  reportedReason: string;
}
