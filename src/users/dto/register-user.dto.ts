import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsString,
} from 'class-validator';
import { IEmailRegisterUserDto } from '@app/interfaces/shared/api/user';
import { ApiProperty } from '@nestjs/swagger';

export class EmailVertifyDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'The email of the User',
    format: 'email',
    uniqueItems: true,
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @IsEmail({}, {
    message: 'email格式错误，请检查您的输入'
  })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly vertifyCode: string;

  @ApiProperty({
    example: 'testt',
    description: 'The nickname of the User',
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  readonly nickName: string;

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
  readonly password: string;
}

export class CheckEmailVertifyDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'The email of the User',
    format: 'email',
    uniqueItems: true,
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly vertifyCode: string;
}

export class EmailRegisterUserDto implements IEmailRegisterUserDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'The email of the User',
    format: 'email',
    uniqueItems: true,
    minLength: 5,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  @IsEmail({}, {
    message: 'email格式错误，请检查您的输入'
  })
  readonly email: string;
}
