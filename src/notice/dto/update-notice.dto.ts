import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { AccessLevel } from '../ineterface';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateNoticeDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly title: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  readonly content: string;
}
