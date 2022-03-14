import { LikeAttitude } from '../schemas';

export interface ILikeEvent {
  targetName: string;
  targetId: string;
  attitude: LikeAttitude;
  userId: string;
}

export class LikeCreatedEvent implements ILikeEvent {
  constructor(data: ILikeEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  targetName: string;
  targetId: string;
  attitude: LikeAttitude;
  userId: string;
}

export class LikeCancelEvent implements ILikeEvent {
  constructor(data: ILikeEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  targetName: string;
  targetId: string;
  attitude: LikeAttitude;
  userId: string;
}