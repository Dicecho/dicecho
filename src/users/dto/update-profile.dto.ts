import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsString,
  IsOptional,
} from 'class-validator';
import { IEmailRegisterUserDto } from '@app/interfaces/shared/api/user';
import { ApiProperty } from '@nestjs/swagger';

interface IUpdateProfileDto {
  nickName: string;
  avatarUrl: string;
  backgroundUrl: string;
  note: string;
  notice: string;
}

export class UpdateProfileDto implements IUpdateProfileDto {
  @IsString()
  @IsOptional()
  readonly nickName: string;

  @IsString()
  @IsOptional()
  readonly avatarUrl: string;

  @IsString()
  @IsOptional()
  readonly backgroundUrl: string;

  @IsString()
  @IsOptional()
  readonly note: string;

  @IsString()
  @IsOptional()
  readonly notice: string;
}
