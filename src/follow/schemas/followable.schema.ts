import { Constructor } from '@app/core';
import { Document } from 'mongoose';

export interface IFollowable extends Document {
  followCount: number;
}

// export function FollowableDocument<TBase extends Constructor<Document>>(Base: TBase) {
//   return class extends Base {
//     followCount: number;
//   };
// }
