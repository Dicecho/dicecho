import { IsNumber, IsOptional, IsString, IsNotEmpty, IsArray, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ToBoolean } from '@app/core'

export * from '@app/interfaces/shared/api/mod';


export interface ITag {
  name: string;
}

export class TagQuery {
  @IsOptional()
  readonly keyword: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  readonly pageSize: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page: number = 1;

  @IsOptional()
  readonly parent: string;

  @ToBoolean()
  @IsOptional()
  readonly isCategory: boolean;
}

export class CreateTagDto {
  @IsString()
  @IsNotEmpty({
    message: '请填写标签名称'
  })
  readonly name: string;
}

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  coverUrl: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  @IsOptional()
  children: Array<string>;
}

