import { IRateListQuery, RateSortKey, SortOrder, IRateFilter } from '@app/interfaces/shared/api';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsEnum, Min, Max, IsString, ValidateNested } from 'class-validator';
import { IsObjectId } from '@app/core';
export * from '@app/interfaces/shared/api/rate';


export class LogFilter {
  @IsString()
  @IsOptional()
  readonly targetName?: string;

  @IsString()
  @IsOptional()
  readonly targetId?: string;

  @IsString()
  @IsOptional()
  readonly action?: string;

  @IsString()
  @IsOptional()
  readonly changedKey?: string; 
}

export class LogListQuery {
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

  @ValidateNested()
  @Type(() => LogFilter)
  @IsOptional()
  readonly filter: Partial<LogFilter>;
}
