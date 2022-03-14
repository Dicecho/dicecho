import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { PageableQuery, RateSortKey, SortOrder } from '@app/interfaces/shared/api';
import { ObjectId } from 'mongodb';
import { IsObjectId } from '@app/core';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ICreateReplayDto } from '../interface';

export enum ReplaySortKey {
  // MEMBER_COUNT = 'memberCount',
  // TOPIC_COUNT = 'topicCount',
  CREATED_AT = 'createdAt',
  LAST_ACTIVITY_AT = 'lastActivityAt',
}

export class ReplayFilter {

  @IsOptional()
  @IsBoolean()
  isRecommend: boolean;
}

export class ReplayListQuery {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  readonly pageSize: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  @IsBoolean()
  readonly isJoined?: boolean;

  @IsOptional()
  readonly sort?: Record<ReplaySortKey, SortOrder>;

  @IsOptional()
  readonly filter?: Partial<ReplayFilter>;
}

export class CreateReplayDto implements ICreateReplayDto {
  @IsString()
  @IsNotEmpty({ message: '请填写bilibili视频的bv号' })
  readonly bvid: string;

  @IsOptional()
  @IsObjectId({
    message: '模组id错误'
  })
  readonly modId: string;
}

export class UpdateReplayDto {
  @IsOptional()
  @IsObjectId({
    message: '模组id错误'
  })
  readonly modId: string;
}
