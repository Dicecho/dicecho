export interface ICommentEvent {
  targetName: string;
  targetId: string;
  userId: string;
  content: string;
  _id: string;
}

export class CommentEvent implements ICommentEvent {
  constructor(data: ICommentEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  _id: string;
  targetName: string;
  targetId: string;
  userId: string;
  content: string;
}

export interface IReplyEvent {
  _id: string;
  targetName: string;
  targetId: string;
  userId: string;
  content: string;
  parent: string;
  replyTo: string | undefined;
}

export class ReplyEvent implements IReplyEvent {
  constructor(data: IReplyEvent) {
    for (const key in data) {
      if (this.hasOwnProperty(key)) {
        (<any>this)[key] = data[key];
      }
    }
  }

  _id: string;
  targetName: string;
  targetId: string;
  userId: string;
  content: string;
  parent: string;
  replyTo: string | undefined;
}