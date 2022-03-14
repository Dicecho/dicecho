import { IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from '@app/interfaces/shared/api';
import { ApiProperty } from '@nestjs/swagger';
import { isValidObjectId } from 'mongoose';

export class CommentDto {
  @IsNotEmpty({
    message: '请填写评论内容',
  })
  readonly content: string;
}

export enum CommentSortKey {
  LIKE_COUNT = 'likeCount',
  // RATE = 'rate',
  CREATED_AT = 'createdAt',
}


export class CommentQueryDto {
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
  readonly sort: Record<CommentSortKey, SortOrder>;

}

