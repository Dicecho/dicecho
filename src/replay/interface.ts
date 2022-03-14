export interface IReplayDto {
  bvid: string,
  videos: number,// 有多少个视频，多个为合集
  coverUrl: string, // 封面
  title: string,
  description: string,
  duration: number,
  owner: {
    mid: number,
    name: string,
    face: string,
  },
  pages: Array<{
    page: number;
    part: string;
    duration: number;
  }>;
  mod?: {
    _id: string;
    title: string;
    coverUrl: string;
    description: string;
    rateAvg: number;
    rateCount: number;
  }
}

export interface ICreateReplayDto {
  bvid: string;
  modId?: string;
}