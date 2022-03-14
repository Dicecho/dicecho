import { IsString, ValidateNested, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { SortOrder } from '@app/interfaces/shared/api';
import { Type, Transform } from 'class-transformer';
import { IsObjectId } from '@app/core';

export enum BlockSortKey {
  CREATED_AT = 'createdAt',
}

export class BlockFilter {
  @IsString()
  @IsOptional()
  readonly targetName?: string;
}

export class BlockQuery {
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
  readonly sort?: Record<BlockSortKey, SortOrder>;

  @ValidateNested()
  @Type(() => BlockFilter)
  @IsOptional()
  readonly filter?: Partial<BlockFilter>;
}
