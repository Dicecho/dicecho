import { IsNotEmpty, IsString, ValidateNested, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { IRateListQuery, RateSortKey, SortOrder } from '@app/interfaces/shared/api';
import { ToBoolean } from '@app/core';
import { ObjectId } from 'mongodb';
import { IsObjectId } from '@app/core';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum DomainSortKey {
  MEMBER_COUNT = 'memberCount',
  TOPIC_COUNT = 'topicCount',
  CREATED_AT = 'createdAt',
  LAST_ACTIVITY_AT = 'lastActivityAt',
}

export class DomainFilter {
  @ToBoolean()
  @IsOptional()
  isRecommend: boolean;
}

export class DomainListQuery {
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

  @IsBoolean()
  @ToBoolean()
  @IsOptional()
  readonly isJoined?: boolean;

  @IsOptional()
  readonly sort?: Record<DomainSortKey, SortOrder>;

  @ValidateNested()
  @Type(() => DomainFilter)
  @IsOptional()
  readonly filter?: Partial<DomainFilter>;
}
