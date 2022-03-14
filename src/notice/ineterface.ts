export enum AccessLevel {
  Public = 'public',
  Private = 'private',
}

export interface INoticeItem {
  targetName: string;
  targetId: string;
}

export interface INoticeDto {
  _id: string;
  title: string;
  content: string;
}
