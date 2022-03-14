import { IsNumber, IsOptional, IsString, IsEnum, Min, Max, ValidateNested, IsArray, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { ToBoolean } from '@app/core';
import {
  SortOrder,
  ModSortKey,
  ModOrigin,
  TagFilterMode,
  IModListQuery,
  IModFilter,
  Operation,
} from '@app/interfaces/shared/api';

export * from '@app/interfaces/shared/api';

export class ModFilter implements IModFilter {
  @IsEnum(ModOrigin)
  @IsOptional()
  origin: ModOrigin;

  @IsString()
  @IsOptional()
  moduleRule: string;

  @IsOptional()
  rateCount: Partial<{ [key in Operation]: number }>;

  @IsOptional()
  updatedAt: Partial<{ [key in Operation]: Date }>;

  @Type(() => ObjectId)
  @Transform(({ value }) => new ObjectId(value))
  @IsOptional()
  author: string;

  @ToBoolean()
  @IsOptional()
  isForeign: boolean;
}

export class ModListQuery implements IModListQuery {
  @IsOptional()
  readonly keyword: string;

  @IsArray()
  @IsOptional()
  readonly tags: string[];

  @IsArray()
  @IsOptional()
  readonly origins: Array<string>;

  @IsArray()
  @IsOptional()
  readonly languages: Array<string>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly minPlayer: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly maxPlayer: number;

  @IsEnum(TagFilterMode)
  @IsOptional()
  readonly tagsMode: TagFilterMode;

  @IsArray()
  @IsOptional()
  readonly ids: Array<string>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  readonly pageSize: number = 10;

  @IsOptional()
  readonly sort: Record<ModSortKey, SortOrder>;

  @ValidateNested()
  @Type(() => ModFilter)
  @IsOptional()
  readonly filter: Partial<ModFilter>;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page: number = 1;
}
