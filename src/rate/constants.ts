export enum RemarkType {
  Empty = 0,
  Short = 1,
  Long = 2,
}

export enum RateType {
  Rate = 0,
  Mark = 1,
}

export enum RemarkContentType {
  Markdown = 'markdown',
  Richtext = 'richtext',
}

export const RemarkTypeWeightMap = {
  [RemarkType.Empty]: 2,
  [RemarkType.Short]: 8,
  [RemarkType.Long]: 10,
}

export enum AccessLevel {
  Public = 'public',
  Private = 'private',
}
