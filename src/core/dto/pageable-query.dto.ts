import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
export * from '@app/interfaces/shared/api/rate';

export enum SortOrder {
  ASC = 1,
  DESC = -1,
}

export class PageableQuery<SortKey extends string = any> {
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
  readonly sort: Record<SortKey, SortOrder>;
}
