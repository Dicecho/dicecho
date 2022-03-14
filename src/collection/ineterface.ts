export enum AccessLevel {
  Public = 'public',
  Private = 'private',
}

export interface ICollectionItem {
  targetName: string;
  targetId: string;
}

export interface ICollectionDto {
  _id: string;
  name: string;
  description: string;
  coverUrl: string;
  isDefault: boolean;
  accessLevel: AccessLevel;
  createdAt: Date;
  isFavorited: boolean;
  favoriteCount: number;
  commentCount: number;
  user: {
    _id: string;
    avatarUrl: string;
    nickName: string;
  };
  items: Array<ICollectionItem>;
  canEdit: boolean;
}
