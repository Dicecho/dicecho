import {
  IsOptional,
  IsString,
  IsObject,
  IsArray,
} from 'class-validator';
import { IsObjectId } from '@app/core';

export class CreateAdminLogDto {
  @IsString()
  readonly log: string;

  @IsOptional()
  @IsString()
  readonly message: string;

  @IsString()
  readonly type: string;

  @IsObject()
  readonly snapshot: any;
}
