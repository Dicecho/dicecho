import { User as UserDocument } from '../schemas';

export interface IFollowEvent {
  follower: UserDocument;
  following: UserDocument;
}

export class FollowEvent implements IFollowEvent {
  constructor(data: IFollowEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  follower: UserDocument;
  following: UserDocument;
}

export class UnfollowEvent implements IFollowEvent {
  constructor(data: IFollowEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  follower: UserDocument;
  following: UserDocument;
}