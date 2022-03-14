export interface IFollowEvent {
  targetName: string;
  targetId: string;
  userId: string;
}

export class FollowCreatedEvent implements IFollowEvent {
  constructor(data: IFollowEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  targetName: string;
  targetId: string;
  userId: string;
}

export class FollowCancelEvent implements IFollowEvent {
  constructor(data: IFollowEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  targetName: string;
  targetId: string;
  userId: string;
}