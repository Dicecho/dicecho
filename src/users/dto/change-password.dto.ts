import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsString,
} from 'class-validator';
import { IEmailRegisterUserDto } from '@app/interfaces/shared/api/user';
import { ApiProperty } from '@nestjs/swagger';

interface IChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export class ChangePasswordDto implements IChangePasswordDto {
  @ApiProperty({
    example: 'secret password change me!',
    description: 'The password of the User',
    format: 'string',
    minLength: 5,
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly oldPassword: string;

  @ApiProperty({
    example: 'secret password change me!',
    description: 'The password of the User',
    format: 'string',
    minLength: 5,
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly newPassword: string;
}
