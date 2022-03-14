import { IsNotEmpty, IsString, ValidateNested, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { IRateListQuery, RateSortKey, SortOrder } from '@app/interfaces/shared/api';
import { ToBoolean } from '@app/core';
import { Type, Transform } from 'class-transformer';
import { IsObjectId } from '@app/core';

export enum CollectionSortKey {
  CREATED_AT = 'createdAt',
  FAVORITE_COUNT = 'favoriteCount',
}

export class CollectionFilter {
  @ToBoolean()
  @IsOptional()
  readonly isRecommend: boolean;
}

export class CollectionListQuery {
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
  readonly sort?: Record<CollectionSortKey, SortOrder>;

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
  @Type(() => CollectionFilter)
  @IsOptional()
  readonly filter?: Partial<CollectionFilter>;
}
