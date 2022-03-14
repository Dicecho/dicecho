import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsString,
} from 'class-validator';

export class SendRescueCodeDto {
  @IsNotEmpty()
  @IsString()
  readonly email: string;
}

export class CheckRescueCodeDto {
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly rescueCode: string;
}

export class RescuePasswordDto {
  @IsNotEmpty()
  @IsString()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly rescueCode: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1024)
  readonly newPassword: string;
}
