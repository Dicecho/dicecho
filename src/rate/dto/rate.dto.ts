import {
  IRateListQuery,
  RateSortKey,
  SortOrder,
  IRateFilter,
} from '@app/interfaces/shared/api';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { IsObjectId } from '@app/core';
export * from '@app/interfaces/shared/api/rate';

export class RateListQuery implements IRateListQuery {
  @IsString()
  @IsOptional()
  readonly modId: string;

  @IsObjectId({
    message: '用户Id错误',
  })
  @IsOptional()
  readonly userId: string;

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
  readonly sort: Record<RateSortKey, SortOrder>;

  @IsOptional()
  readonly filter: Partial<IRateFilter>;
}
