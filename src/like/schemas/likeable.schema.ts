import { Constructor } from '@app/core';
import { Document } from 'mongoose';

export interface ILikeable extends Document {
  likeCount: number;
  dislikeCount: number;
  declareCounts: any;
}

// export function LikeableDocument<TBase extends Constructor<Document>>(Base: TBase) {
//   return class extends Base {
//     likeCount: number;
//   };
// }
