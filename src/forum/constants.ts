export enum StickLevel {
  None = 0, // 没有置顶
  Domain = 1, // 域级别
  Category = 2, // 域分类级别
  All = 3, // 全站级别
}


export enum DomainRole {
  Member = 'member',
  Moderator = 'moderator',
}

export enum TopicContentType {
  Markdown = 'markdown',
  Text = 'text',
  Picture = 'picture',
  Vote = 'vote',
  Video = 'video',
}