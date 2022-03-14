import { IsNotEmpty, IsString, ValidateNested, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { IRateListQuery, RateSortKey, SortOrder } from '@app/interfaces/shared/api';
import { Type, Transform } from 'class-transformer';
import { IsObjectId } from '@app/core';

export enum NoticeSortKey {
  CREATED_AT = 'createdAt',
  FAVORITE_COUNT = 'favoriteCount',
}

export class NoticeFilter {
}

export class NoticeListQuery {
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
  readonly sort?: Record<NoticeSortKey, SortOrder>;

  @IsString()
  @IsOptional()
  readonly targetName?: string;

  @IsString()
  @IsOptional()
  readonly targetId?: string;

  @IsObjectId()
  @IsOptional()
  readonly creatorId?: string;

  @ValidateNested()
  @Type(() => NoticeFilter)
  @IsOptional()
  readonly filter?: Partial<NoticeFilter>;
}
