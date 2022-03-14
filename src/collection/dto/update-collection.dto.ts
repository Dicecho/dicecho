import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ObjectId } from 'mongodb';
import { AccessLevel } from '../ineterface';
import { IsObjectId } from '@app/core';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  @IsOptional()
  readonly items: Array<ItemDto>;
}


export class ItemDto {
  @IsNotEmpty()
  @IsString()
  targetName: string;

  @IsNotEmpty()
  @IsObjectId({
    message: '收藏品Id错误'
  })
  targetId: string;
}

export class UpdateCollectionDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly name: string;

  @IsString()
  @IsOptional()
  readonly description: string;

  @IsString()
  @IsOptional()
  readonly coverUrl: string;

  @IsEnum(AccessLevel)
  @IsOptional()
  readonly accessLevel: AccessLevel;
}
