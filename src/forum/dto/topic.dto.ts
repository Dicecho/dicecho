import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { IRateListQuery, RateSortKey, SortOrder } from '@app/interfaces/shared/api';
import { ObjectId } from 'mongodb';
import { IsObjectId } from '@app/core';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum TopicSortKey {
  LIKE_COUNT = 'likeCount',
  COMMENT_COUNT = 'commentCount',
  CREATED_AT = 'createdAt',
}

export class TopcFilter {

  @Type(() => ObjectId)
  @Transform(({ value }) => new ObjectId(value))
  @IsObjectId({
    message: '板块Id错误'
  })
  @IsOptional()
  readonly domain: string;

  @Type(() => ObjectId)
  @Transform(({ value }) => new ObjectId(value))
  @IsObjectId({
    message: '作者Id错误'
  })
  @IsOptional()
  readonly author: string;
}

export class TopicListQuery {
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

  @Type(() => ObjectId)
  @Transform(({ value }) => new ObjectId(value))
  @IsObjectId({
    message: '用户Id错误'
  })
  @IsOptional()
  readonly userId: string;

  @Type(() => ObjectId)
  @Transform(({ value }) => new ObjectId(value))
  @IsObjectId({
    message: '模组Id错误'
  })
  @IsOptional()
  readonly modId: string;

  @IsOptional()
  readonly sort: Record<TopicSortKey, SortOrder>;

  @IsOptional()
  readonly filter: Partial<TopcFilter>;
}

export class CreateTopicDto {
    @Type(() => ObjectId)
    @Transform(({ value }) => new ObjectId(value))
    @IsObjectId({
      message: '板块Id错误'
    })
    @IsOptional()
    readonly domainId: string;

    @Type(() => ObjectId)
    @Transform(({ value }) => new ObjectId(value))
    @IsObjectId({
      message: '模组Id错误'
    })
    @IsOptional()
    readonly modId: string;

    @IsObjectId({
      each: true,
      message: '关联模组Id错误',
    })
    @IsOptional()
    readonly relatedModIds: string[];

    @IsString()
    @IsNotEmpty({ message: '标题不能为空' })
    readonly title: string;

    @IsString()
    @IsNotEmpty({ message: '内容不能为空' })
    readonly content: string;

    @IsBoolean()
    @IsOptional()
    readonly isSpoiler: boolean;
}


export class UpdateTopicDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @IsOptional()
  readonly title: string;

  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  @IsOptional()
  readonly content: string;

  @IsBoolean()
  @IsOptional()
  readonly isSpoiler: boolean;

  @IsObjectId({
    each: true,
    message: '关联模组Id错误',
  })
  @IsOptional()
  readonly relatedModIds: string[];
}
